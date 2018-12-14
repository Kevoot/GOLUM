#include <Stepper.h>

// On completion each arduino will control 12 modules. For now, set to 2 for testing
#define SERIAL_NUM 1
#define NUM_MODULES 1
// #define NUM_MODULES 12

// Analog can be used as digital pins, might
// as well maximize the amount of steppers per arduino
#define IN1_1  A0
#define IN1_2  A1
#define IN1_3  A2
#define IN1_4  A3
#define buttonPin1 2

#define IN2_1  A4
#define IN2_2  A5
#define IN2_3  A6
#define IN2_4  A7
#define buttonPin2 3

const int stepsPerMotorRevolution = 32;  //No of steps per internal revolution of motor,
//4-step mode as used in Arduino Stepper library

//no of steps per revolution of the output shaft
const int stepsPerOutputRevolution = 4096;

const int stepsPerState = 128;

// initialize the stepper library on pins, Motor rev steps, "Firing" sequence 1-3-2-4,
Stepper stepper1(stepsPerMotorRevolution, IN1_1, IN1_3, IN1_2, IN1_4);
Stepper stepper2(stepsPerMotorRevolution, IN2_1, IN2_3, IN2_2, IN2_4);

int currentState1 = 0;
int currentState2 = 0;
int pos1 = 0;
int pos2 = 0;

bool calibrated = false;

void setup() {
  Serial.begin(9600);

  // Initialize all pins for steppers
  pinMode(IN1_1, OUTPUT);
  pinMode(IN1_2, OUTPUT);
  pinMode(IN1_3, OUTPUT);
  pinMode(IN1_4, OUTPUT);

  pinMode(IN2_1, OUTPUT);
  pinMode(IN2_2, OUTPUT);
  pinMode(IN2_3, OUTPUT);
  pinMode(IN2_4, OUTPUT);

  // initialize the calibration buttons
  pinMode(buttonPin1, INPUT);
  pinMode(buttonPin2, INPUT);

  stepper1.setSpeed(500);
  stepper2.setSpeed(500);
}

void calibrateMotors() {
  for (int i = 1; i <= NUM_MODULES; i++) {
    resetToZeroPosition(i);
    delay(200);
  }
}

// Spins module motor until calibration sensor is tripped
void resetToZeroPosition(int module) {
  int buttonState = 0;
  while (buttonState != 1) {
    switch (module) {
      case 1:
        stepper1.step(-10);
        buttonState = digitalRead(buttonPin1);
        break;
      case 2:
        stepper2.step(-10);
        buttonState = digitalRead(buttonPin2);
        break;
      default:
        break;
    }
    delay(50);
    if (buttonState == HIGH) {
      return;
    }
  }
}

// spins a target module targetState number of steps. Once we have a reliable build this
// needs to spin relative to the current position instead.
void moveStepperToPosition(int module, int targetState) {
  switch (module) {
    case 0:
      if (pos1 != stepsPerState * targetState) {
        pos1 = stepsPerState * targetState;
        // negative because the stepper is mounted backwards
        stepper1.step(-pos1);
        currentState1 = targetState;
      }
      else return;
      break;
    case 1:
      if (pos2 != stepsPerState * targetState) {
        pos2 = stepsPerState * targetState;
        stepper2.step(-pos2);
        currentState2 = targetState;
      }
      else return;
      break;
    default:
      break;
  }
  delay(500);
}

// Convert a C char string to a Hex value
int StrToHex(char str[])
{
  return (int) strtol(str, 0, 16);
}

void loop() {
  char c;
  int charsRead = 0;
  String strVal = "";
  char input[4];

  // Until calibrated, complain to the controller that it
  // needs to be calibrated
  while (!calibrated) {
    Serial.write('N');
    delay(500);
    if (Serial.available() > 0) {
      c = Serial.read();
      if (c == 'C') {
        Serial.write('W');
        calibrateMotors();
        calibrated = true;
        delay(500);
        // Once done, let the controller know we're good to go
        Serial.write('D');
        stepper1.setSpeed(8x00);
      }
    }
  }

  // All input from controller now is to change positions,
  // Format is "M<Hex 0-F>S<Hex 0-F>"
  // M0 = first module
  // SF = state 15
  if (Serial.available() > 0) {
    charsRead = Serial.readBytesUntil('\n', input, 4);
    if (input[0] == 'M' && input[2] == 'S') {
      char moduleInput[2];
      moduleInput[0] = input[1];
      moduleInput[1] = '\0';
      char stateInput[2];
      stateInput[0] = input[3];
      stateInput[1] = '\0';

      moveStepperToPosition(StrToHex(moduleInput), StrToHex(stateInput));

      delay(1000);
      // Always let controller know when we're done.
      Serial.write('D');
    }
  }
}

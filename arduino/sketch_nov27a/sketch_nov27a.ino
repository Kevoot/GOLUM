#include <Stepper.h>

// Every Arduino MUST have a unique serial!
#define SERIAL_NUM "I0"

#define NUM_MODULES 1
// On completion each arduino will control 12 modules. For now, set to 2 for testing
// #define NUM_MODULES 11

// Analog can be used as digital pins, might
// as well maximize the amount of steppers per arduino
#define IN0_1  A0
#define IN0_2  A1
#define IN0_3  A2
#define IN0_4  A3

#define IN1_1  A4
#define IN1_2  A5
#define IN1_3  A6
#define IN1_4  A7

#define IN2_1  A8
#define IN2_2  A9
#define IN2_3  A10
#define IN2_4  A11

#define IN3_1  A12
#define IN3_2  A13
#define IN3_3  A14
#define IN3_4  A15

#define IN4_1  22
#define IN4_2  23
#define IN4_3  24
#define IN4_4  25

#define IN5_1  26
#define IN5_2  27
#define IN5_3  28
#define IN5_4  29

#define IN6_1  30
#define IN6_2  31
#define IN6_3  32
#define IN6_4  33

#define IN7_1  34
#define IN7_2  35
#define IN7_3  36
#define IN7_4  37

#define IN8_1  38
#define IN8_2  39
#define IN8_3  40
#define IN8_4  41

#define IN9_1  42
#define IN9_2  43
#define IN9_3  44
#define IN9_4  45

#define IN10_1  46
#define IN10_2  47
#define IN10_3  48
#define IN10_4  49

int buttonPins[11] = {
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
};

const int stepsPerMotorRevolution = 32;  //No of steps per internal revolution of motor,
//4-step mode as used in Arduino Stepper library

//no of steps per revolution of the output shaft
const int stepsPerOutputRevolution = 4096;

const int stepsPerState = 128;

// initialize the stepper library on pins, Motor rev steps, "Firing" sequence 1-3-2-4
// Ex: Stepper stepper0(stepsPerMotorRevolution, IN0_1, IN0_3, IN0_2, IN0_4);
Stepper steppers[11] = {
  Stepper(stepsPerMotorRevolution, IN0_1, IN0_3, IN0_2, IN0_4),
  Stepper(stepsPerMotorRevolution, IN1_1, IN1_3, IN1_2, IN1_4),
  Stepper(stepsPerMotorRevolution, IN2_1, IN2_3, IN2_2, IN2_4),
  Stepper(stepsPerMotorRevolution, IN3_1, IN3_3, IN3_2, IN3_4),
  Stepper(stepsPerMotorRevolution, IN4_1, IN4_3, IN4_2, IN4_4),
  Stepper(stepsPerMotorRevolution, IN5_1, IN5_3, IN5_2, IN5_4),
  Stepper(stepsPerMotorRevolution, IN6_1, IN6_3, IN6_2, IN6_4),
  Stepper(stepsPerMotorRevolution, IN7_1, IN7_3, IN7_2, IN7_4),
  Stepper(stepsPerMotorRevolution, IN8_1, IN8_3, IN8_2, IN8_4),
  Stepper(stepsPerMotorRevolution, IN9_1, IN9_3, IN9_2, IN9_4),
  Stepper(stepsPerMotorRevolution, IN10_1, IN10_3, IN10_2, IN10_4)
};

int currentStates[11];

int pos[11];

bool calibrated = false;
bool identified = false;

int MAX_STATE = 0xf;

void setup() {
  Serial.begin(9600);

  // initialize the calibration buttons
  for (int i = 0; i < NUM_MODULES; i++) {
    pinMode(buttonPins[i], INPUT);
  }

  for (int i = 0; i < NUM_MODULES; i++) {
    steppers[i].setSpeed(500);
  }

  // Not sure if necessary, may be able to assign static device locations instead.
  // identify();
}

void calibrateMotors() {
  for (int i = 0; i < NUM_MODULES; i++) {
    resetToZeroPosition(i);
  }
}

// Spins module motor until calibration sensor is tripped
void resetToZeroPosition(int module) {
  int buttonState = 0;

  steppers[module].setSpeed(200);

  while (buttonState < 1) {
    buttonState += digitalRead(buttonPins[module]);
    delay(50);
    buttonState += digitalRead(buttonPins[module]);
    delay(50);
    buttonState += digitalRead(buttonPins[module]);
    if (buttonState > 0) {
      currentStates[module] = 0;
      steppers[module].setSpeed(500);
      return;
    }
    delay(50);
    steppers[module].step(-10);
  }
}

// Not sure if this will be necessary
void identify() {
  char c;
  int charsRead = 0;
  String strVal = "";
  char input[4];

  // Until calibrated, complain to the controller that it
  // needs to be calibrated
  while (!identified) {
    Serial.write(SERIAL_NUM);
    delay(500);
    if (Serial.available() > 0) {
      c = Serial.read();
      if (c == 'I') {
        identified = true;
        delay(500);
        // We've been identified, return and await calibration
        return;
      }
    }
  }
}

// spins a target module targetState number of steps. Once we have a reliable build this
// needs to spin relative to the current position instead.
void moveStepperToPosition(int module, int targetState) {
  if (currentStates[module] != targetState && module < NUM_MODULES) {
    if (targetState < currentStates[module]) {
      // Spin to 15, calibrate, set state == 0, spin to target
      steppers[module].step(-((MAX_STATE - currentStates[module]) * stepsPerState));
      resetToZeroPosition(module);
    }
    steppers[module].step(-((targetState - currentStates[module]) * stepsPerState));
    pos[module] = stepsPerState * targetState;
    currentStates[module] = targetState;
  }
  else return;
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
        // Once done, let the controller know we're good to go
        Serial.write('C');
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

      Serial.write('W');
      moveStepperToPosition(StrToHex(moduleInput), StrToHex(stateInput));

      delay(200);
      // Always let controller know when we're done.
      Serial.write('D');
    }
  }
}

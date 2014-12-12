
#include "Tlc5940.h"

//int togglePin = 2;
int pos0 = 3;
int pos1 = 4;
int button = 7;
int ana0 = 11;
int testPin = 13;

int pwmResolution = 4095;

int cycleRunning = 0;

int lastTime = 0;
int hz = 2400; // cycles per second
int periodLength = 300; // number of cycles per period
float cyclesPerPeriod = (float)periodLength / 2; // number of cycles between max and min voltage levels
float voltageCycleRate = pwmResolution / cyclesPerPeriod; // rate of change per cycle

float microsPerCycle = 1000000 / hz;
int currentCycle = 0;
int currentState = 0;
int currentPhase = 0;

int numChannels = 12;


int currentCycles [12] = {
  0,0,0,0 ,0,0,0,0 ,0,0,0,0};
int currentStates [12] = {
  0,0,0,0 ,0,0,0,0 ,0,0,0,0};
int currentPhases [12] = {
  0,0,0,0 ,0,0,0,0 ,0,0,0,0};

int pin0s [12] = {
  0,2,5,0 ,0,0,0,0 ,0,0,0,0};
int pin1s [12] = {
  0,4,6,0 ,0,0,6,0 ,0,0,0,0};

int pwmChannels [12] = {
  0,1,2,3 ,4,5,6,7 ,8,9,10,11};
int buttons [12] = {
  8,8,7,8 ,8,8,8,8 ,8,8,8,8};
int cycleRunnings [12] = {
  0,0,0,0 ,0,0,0,0 ,0,0,0,0};

float voltageLevels [12] = {
  0,0,0,0 ,0,0,0,0 ,0,0,0,0};

int incomingByte = 0;

void setup(){ 
  Tlc.init();
  //  TCCR2B = TCCR2B & 0b11111000 | 0x01;
  //  TCCR1B = TCCR1B & 0b11111000 | 0x01;
  Serial.begin(19200);
  lastTime = micros();


  int channelId = numChannels;

  while (--channelId >= 0){
    pinMode(pin0s[channelId], OUTPUT);
    pinMode(pin1s[channelId], OUTPUT);

    toggle(channelId);
  }

  pinMode(testPin, OUTPUT);
}

void loop(){
  int currentTime = micros();
  int deltaTime = currentTime - lastTime;
  //Serial.println(deltaTime);

  if (deltaTime >= microsPerCycle){
    lastTime = currentTime;
    onCycle();
    Tlc.update();
  }
}

void onCycle(){
  if (Serial.available() > 0) {
    // read the incoming byte:
    incomingByte = Serial.read();

    // say what you got:
//    Serial.println((char)incomingByte);
    
    cycleRunnings[incomingByte-'0'] = 1;
  }
  currentCycle++;

  // for each pin

  int channelId = numChannels;
  int currentPhase = 0;
  float voltageLevel = 0;

  while (--channelId >= 0){
    if (cycleRunnings[channelId] == 1){
      switch(currentPhases[channelId]){
      case 0:
        //0 = moving to full strength bottom from neutral
        voltageLevels[channelId] += voltageCycleRate;
        writeVoltage(channelId, voltageLevels[channelId], pwmResolution, 1, false);
        break;
      case 1:
        //1 = moving to neutral from full strength bottom
        voltageLevels[channelId] -= voltageCycleRate * 16;
        writeVoltage(channelId, voltageLevels[channelId], 0, 2, false);
        break;
      case 2:
        //2 = moving to full strength top from neutral
        voltageLevels[channelId] += voltageCycleRate * 16;
        writeVoltage(channelId, voltageLevels[channelId], pwmResolution, 3, false);
        break;
      case 3:
        //3 = moving to neutral from full strength top
        voltageLevels[channelId] -= voltageCycleRate;
        writeVoltage(channelId, voltageLevels[channelId], 0, 0, true);
        break;
      }
      //      Serial.println(voltageLevels[channelId]);

    } 
    else {
      if (digitalRead(buttons[channelId]) == HIGH){
        Serial.println("Cycle Begin");
        cycleRunnings[channelId] = 1;
      }
    }
  }



}

void writeVoltage(int channelId, float v, int limit, int nextPhase, boolean complete){
  v = min(max(0,v),pwmResolution);

  int pwmChannel = pwmChannels[channelId];
  int pin0 = pin0s[channelId];
  int pin1 = pin1s[channelId];

  Tlc.set(pwmChannel, (int)v);

  if (abs(limit-v) < 1){
    currentPhases[channelId] = nextPhase;
    if (complete == true){
      cycleRunnings[channelId] = 0;
      currentPhases[channelId] = 0;
      Serial.println("end cycle");
      digitalWrite(testPin, LOW);
      digitalWrite(pin0, LOW);
      digitalWrite(pin1, LOW);
    } 
    if (v < 0.01){
      v = 0;
      toggle(channelId);
    }
  }
}

void toggle(int channelId){
  Serial.println("toggle");

  int pin0 = pin0s[channelId];
  int pin1 = pin1s[channelId];

  currentStates[channelId] = ++currentStates[channelId] % 2;
  if (currentStates[channelId] == 1){
    digitalWrite(testPin, HIGH);
    digitalWrite(pin0, HIGH);
    digitalWrite(pin1, LOW);
  } 
  else {
    digitalWrite(testPin, LOW);
    digitalWrite(pin0, LOW);
    digitalWrite(pin1, HIGH);
  }
}



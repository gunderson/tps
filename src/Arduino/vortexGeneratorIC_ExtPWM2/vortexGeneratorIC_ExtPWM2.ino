
#include "Tlc5940.h"

//int togglePin = 2;
int pos0 = 3;
int pos1 = 4;
int button = 7;
int ana0 = 11;
int testPin = 13;

int pwmResolution = 256;

int cycleRunning = 0;

int lastTime = 0;
int hz = 600; // cycles per second
int periodLength = 600; // number of cycles per period
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
  7,7,7,3 ,5,7,7,7 ,7,7,7,7};
int pin1s [12] = {
  7,7,7,4 ,6,7,7,7 ,7,7,7,7};

int pwmChannels [12] = {
  0,1,2,3 ,4,5,6,7 ,8,9,10,11};
int buttons [12] = {
  6,6,6,8 ,8,6,6,6 ,6,6,6,6};
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

//  while (--channelId >= 0){
//    pinMode(pin0s[channelId], OUTPUT);
//    pinMode(pin1s[channelId], OUTPUT);
//
//    toggle(channelId);
//  }

  pinMode(testPin, OUTPUT);
}

void loop(){
  int currentTime = micros();
  int deltaTime = currentTime - lastTime;
  //Serial.println(deltaTime);

  if (deltaTime >= microsPerCycle){
    lastTime = currentTime;
    onCycle();
  }
    Tlc.update();
}

void onCycle(){
  if (Serial.available() > 0) {
    // read the incoming byte:
    incomingByte = Serial.read() - 48;

    // say what you got:
//    Serial.println((char)incomingByte);
    if (incomingByte >= 0 && incomingByte < numChannels){
      if (cycleRunnings[incomingByte] == 0){
        cycleRunnings[incomingByte] = 1;
        currentCycles[incomingByte] = 0;
        voltageLevels[incomingByte] = 0;
        currentPhases[incomingByte] = 0;
        Serial.println(incomingByte, DEC);
      }
    }
    
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
        voltageLevels[channelId] += 1;//voltageCycleRate;
        writeVoltage(channelId, 0, voltageLevels[channelId], pwmResolution, 1, false);
        break;
      case 1:
        //1 = moving to neutral from full strength bottom
        voltageLevels[channelId] -= voltageCycleRate * 64;
        writeVoltage(channelId, 0, voltageLevels[channelId], 0, 2, false);
        break;
      case 2:
        //2 = moving to full strength top from neutral
        voltageLevels[channelId] += voltageCycleRate * 64;
        writeVoltage(channelId, 1, voltageLevels[channelId], pwmResolution, 3, false);
        break;
      case 3:
        //3 = moving to neutral from full strength top
        voltageLevels[channelId] -= voltageCycleRate;
        writeVoltage(channelId, 1, voltageLevels[channelId], 0, 0, true);
        break;
      }
    } 
    else {
      if (digitalRead(buttons[channelId]) == HIGH){
        cycleRunnings[channelId] = 1;
      }
    }
  }



}

void writeVoltage(int channelId, int activeChannel, float v, int limit, int nextPhase, boolean complete){
  v = min(max(0,v),pwmResolution);

  int pwmChannel0 = pin0s[channelId];
  int pwmChannel1 = pin1s[channelId];

  if (activeChannel == 0){
    Tlc.set(pwmChannel0, (int)v);
    Tlc.set(pwmChannel1, 0);
  } else {
    Tlc.set(pwmChannel0, 0);
    Tlc.set(pwmChannel1, (int)v);
  }

  if (abs(limit-v) < 1){
    currentPhases[channelId] = nextPhase;
    if (complete == true){
      cycleRunnings[channelId] = 0;
    }
  }
}

//void writeVoltage(int channelId, float v, int limit, int nextPhase, boolean complete){
//  v = min(max(0,v),pwmResolution);
//
//  int pwmChannel = pwmChannels[channelId];
//  int pin0 = pin0s[channelId];
//  int pin1 = pin1s[channelId];
//
//  Tlc.set(pwmChannel, (int)v);
//
//  if (abs(limit-v) < 1){
//    currentPhases[channelId] = nextPhase;
//    if (complete == true){
//      cycleRunnings[channelId] = 0;
//      currentPhases[channelId] = 0;
//      digitalWrite(pin0, LOW);
//      digitalWrite(pin1, LOW);
//    } 
//    if (v < 0.01){
//      v = 0;
//      toggle(channelId);
//    }
//  }
//}

void toggle(int channelId){
//  Serial.println("toggle");

  int pin0 = pin0s[channelId];
  int pin1 = pin1s[channelId];
  
  
//    Serial.println(pin0);
//    Serial.println(pin1);

  currentStates[channelId] = ++currentStates[channelId] % 2;
  if (currentStates[channelId] == 1){
    Serial.println("toggle 1");
//    digitalWrite(testPin, HIGH);
    digitalWrite(pin0, HIGH);
    digitalWrite(pin1, LOW);
  } 
  else {
    Serial.println("toggle 2");
//    digitalWrite(testPin, LOW);
    digitalWrite(pin0, LOW);
    digitalWrite(pin1, HIGH);
  }
}



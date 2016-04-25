#include "OneWire/OneWire.h"
#include "spark-dallas-temperature/spark-dallas-temperature.h"

#include "math.h"
#include "cellular_hal.h"

DallasTemperature dallas(new OneWire(D3));
int tempInt = 0;
int lastPublish = 0;
int lastAzurePublish = 0;
int interval = 0;

int publishRate = 30000;
float temp;

STARTUP(cellular_credentials_set("m2m.com.attz","","",NULL));

void setup()
{
     Particle.variable("tempf", &tempInt, INT);
	 dallas.begin();
}

void loop()
{
    updateTemp();
    updatePublishRate();    
}

void updatePublishRate() {
    if (temp < 60) {
        publishRate = 10 * 60 * 1000; // sleepytime
    } else if (temp < 80) {
        publishRate = 1 * 60 * 1000; // daytime and heated
    } else if (temp < 100) {
        publishRate = 30 * 1000; // heating up
    } else {
        publishRate = 5 * 1000; // sauna mode
    }
}

void updateTemp() {
    dallas.requestTemperatures();
    float celsius = dallas.getTempCByIndex( 0 );
    temp = (celsius * 9.0)/ 5.0 + 32.0; // C to F
    tempInt = (int) temp;
    
    if (millis() - lastPublish > publishRate) {
        publishTemp();
    }
}

void publishTemp() {
    if (tempInt > 0) {
    	Particle.publish("tempf", String(tempInt));
    }
    
    lastPublish = millis();
}


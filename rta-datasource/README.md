### Run the IOT-Datasource:

Download dataset from https://drive.google.com/file/d/1hl5KI5-kwQwwmz7fHgB_7lUNjBV8OVDu/view?usp=sharing
and place it in IOT-Datasource folder and use below commands

Download the CVD_Vital_SIgns from https://drive.google.com/file/d/11wGLcOOzrCi2nRSmHd7xpXPVybY2-C6K/view
and place it in the IOT-Datasource folder and run the below commands

```
npm install
```
For normal streaming
```
node server.js
```
For Kafka streaming - Start your local zookeeper and Kafka
```
node kafkaProducer.js
``` 

### Run the IOT-Datasource:

Dowanload dataset from https://drive.google.com/file/d/1hl5KI5-kwQwwmz7fHgB_7lUNjBV8OVDu/view?usp=sharing
and place it in IOT-Datasource folder and use below commands

```
npm install
```
For normal streaming
```
node server.js
```
For Kafka streaming - Start your local zookeper and Kafka
```
node kafkaProducer.js
``` 
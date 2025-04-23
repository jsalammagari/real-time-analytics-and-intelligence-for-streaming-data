### Run the IOT-Datasource:

Download datasets from [https://drive.google.com/file/d/1hl5KI5-kwQwwmz7fHgB_7lUNjBV8OVDu/view?usp=sharing](https://drive.google.com/drive/folders/1TmCUj34NUWyt8iKvFNDt7UFx5kaIYRE5?usp=drive_link)
and place it in rta-Datasource folder and use below commands

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

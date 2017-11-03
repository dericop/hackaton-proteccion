/*
Bancolombia 2017
 */
const moment = require('moment'),
Cloudant = require('cloudant'),
cfenv = require('cfenv');

const stringify = require('json-stringify-safe');

const service = cfenv.getAppEnv().services['user-provided'].find(upsi => upsi.name === 'cloudantBOT');
const cloudant = Cloudant(service.credentials),
logsDb = cloudant.db.use('logs-sofy');

function storeRecord(messageId, source, destination, uid, obj, detail, type) {
  const record = new LogRecord(messageId, source, destination, type);
  record.setUserId(uid).setEventDetail(detail).setData(JSON.parse(stringify(obj))); // Fix circular references issue
  logsDb.insert(record, err => {
    if (err) {
        console.error(err);
    }
  });
}

class Logger {
  constructor(metadata) {
      if (metadata) {
          this.messageId = metadata.messageId;
          this.uid = metadata.senderId;
          this.source = metadata.source;
          this.destination = metadata.destination
      }
  }

  info(obj, detail) {
      storeRecord(this.messageId, this.source, this.destination, this.uid, obj, detail, 'info');
  }

  error(obj, detail) {
      storeRecord(this.messageId, this.source, this.destination, this.uid, obj, detail, 'error');
  }

  debug(obj, detail) {
      if (process.env.DEBUG === 'true') {
          // Do not store debug messages in logging database!
          console.error(JSON.stringify({ debug: { message: detail, payload: obj } }));
      }
  }
}

class LogRecord {
  constructor(messageId, source, destination, type, producer) {
      this.metadata = {
          messageId: messageId,
          userId: '',
          timestamp: moment().utcOffset('-0500').format('YYYY-MM-DDTHH:mm:ss.SS ZZ').toString(), // YYYY-MM-DDTHH:mm:ss.ms
          event: {
              producer: process.env.APP_NAME || producer,
              source: source,
              destination: destination,
              type: type || 'info',
              detail: ''
          }
      }
      this.data = {};
  }

  setEventDetail(detail) {
      if (detail) {
          this.metadata.event.detail = detail;
      }
      return this;
  }

  setUserId(userId) {
      if (userId) {
          this.metadata.userId = userId;
      }
      return this;
  }

  setData(data) {
      if (data) {
          this.data = data;
      }
      return this;
  }

  setTopic(topic) {
      if (topic) {
          this.data.topic = topic;
      }
      return this;
  }

  setStep(step) {
      if (step) {
          this.data.step = step;
      }
      return this;
  }

  setPayload(payload) {
      if (payload) {
          this.data.payload = payload;
      }
      return this;
  }
}

module.exports = Logger;
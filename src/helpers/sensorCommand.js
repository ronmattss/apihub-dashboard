const schema = require('./sensorCommandSchema.json');

function isObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

const SUPPORTED = ['Matrix', 'PinWrite', 'PinRead', 'PwmWrite', 'SerialPrint', 'SerialLog', 'Custom'];

function validate(cmd) {
  if (!isObject(cmd)) throw new Error('SensorCommand must be an object');
  if (typeof cmd.Type !== 'string' || cmd.Type.length === 0) throw new Error('SensorCommand.Type is required and must be a string');

  const type = String(cmd.Type);
  if (!SUPPORTED.includes(type)) throw new Error(`Unsupported SensorCommand.Type: ${type}`);

  if (cmd.Pin !== undefined && cmd.Pin !== null) {
    const asNum = Number(cmd.Pin);
    if (!Number.isFinite(asNum)) throw new Error('SensorCommand.Pin must be a number');
    cmd.Pin = Math.floor(asNum);
  }

  if (cmd.Value !== undefined && cmd.Value !== null) {
    const asNum = Number(cmd.Value);
    if (!Number.isFinite(asNum)) throw new Error('SensorCommand.Value must be a number');
    cmd.Value = asNum;
  }

  if (cmd.Message !== undefined && cmd.Message !== null && typeof cmd.Message !== 'string') throw new Error('SensorCommand.Message must be a string');
  if (cmd.Id !== undefined && cmd.Id !== null && typeof cmd.Id !== 'string') throw new Error('SensorCommand.Id must be a string');
  if (cmd.PinMode !== undefined && cmd.PinMode !== null && typeof cmd.PinMode !== 'string') throw new Error('SensorCommand.PinMode must be a string');

  // Per-type rules
  switch (type) {
    case 'Matrix':
      if (cmd.Value === undefined || (cmd.Value !== 0 && cmd.Value !== 1)) throw new Error('Matrix requires Value 0 or 1');
      break;
    case 'PinWrite':
      if (cmd.Pin === undefined || cmd.Pin === null) throw new Error('PinWrite requires Pin');
      if (cmd.Value === undefined || (cmd.Value !== 0 && cmd.Value !== 1)) throw new Error('PinWrite.Value must be 0 or 1');
      break;
    case 'PinRead':
      if (cmd.Pin === undefined || cmd.Pin === null) throw new Error('PinRead requires Pin');
      break;
    case 'PwmWrite':
      if (cmd.Pin === undefined || cmd.Pin === null) throw new Error('PwmWrite requires Pin');
      if (cmd.Value === undefined || cmd.Value < 0 || cmd.Value > 255) throw new Error('PwmWrite.Value must be between 0 and 255');
      break;
    case 'SerialPrint':
    case 'SerialLog':
      if (cmd.Message === undefined || cmd.Message === null) throw new Error(`${type} requires Message`);
      break;
    default:
      break;
  }

  return true;
}

function build(input) {
  // Accept object or JSON string; if string that parses to primitive, use as Message
  let obj = input;
  if (typeof input === 'string') {
    try { obj = JSON.parse(input); } catch { obj = { Type: 'Custom', Message: input }; }
  }

  if (!isObject(obj)) throw new Error('Unsupported sensor command input');

  const cmd = {
    Type: obj.Type || obj.type || 'Custom',
    Pin: obj.Pin ?? obj.pin ?? null,
    Value: obj.Value ?? obj.value ?? (obj.Value === 0 ? 0 : (obj.value === 0 ? 0 : (obj.Value ?? obj.value ?? null))),
    Message: obj.Message ?? obj.message ?? null,
    Id: obj.Id ?? obj.id ?? null,
    PinMode: obj.PinMode ?? obj.pinMode ?? null
  };

  // Normalize numeric types
  if (cmd.Pin !== null && cmd.Pin !== undefined) cmd.Pin = Number.isInteger(cmd.Pin) ? cmd.Pin : Math.floor(Number(cmd.Pin));
  if (cmd.Value !== null && cmd.Value !== undefined) cmd.Value = Number(cmd.Value);

  // Normalize Type casing to known forms
  if (typeof cmd.Type === 'string') {
    const t = String(cmd.Type).toLowerCase();
    const map = {
      'matrix': 'Matrix',
      'pinwrite': 'PinWrite',
      'pinread': 'PinRead',
      'pwmwrite': 'PwmWrite',
      'serialprint': 'SerialPrint',
      'seriallog': 'SerialLog',
      'custom': 'Custom'
    };
    cmd.Type = map[t] || cmd.Type;
  }

  validate(cmd);
  return cmd;
}

function _genId(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
}

function createSample(type) {
  const t = (type || '').toString();
  switch (t) {
    case 'Matrix':
      return { Type: 'Matrix', Value: 1, Id: _genId('m') };
    case 'PinWrite':
      return { Type: 'PinWrite', Pin: 13, Value: 1, PinMode: 'OUTPUT', Id: _genId('p') };
    case 'PinRead':
      return { Type: 'PinRead', Pin: 7, PinMode: 'INPUT_PULLUP', Id: _genId('r') };
    case 'PwmWrite':
      return { Type: 'PwmWrite', Pin: 5, Value: 128, Id: _genId('w') };
    case 'SerialPrint':
      return { Type: 'SerialPrint', Message: 'Hello', Id: _genId('s') };
    case 'SerialLog':
      return { Type: 'SerialLog', Message: 'Log entry', Id: _genId('l') };
    default:
      return { Type: 'Custom', Message: 'custom', Id: _genId('c') };
  }
}

module.exports = { schema, validate, build, SUPPORTED, createSample };

// Mock socket.io-client for Jest tests
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  connected: false,
  id: 'mock-socket-id',
};

const io = jest.fn(() => mockSocket);
io.mockSocket = mockSocket;

module.exports = io;
module.exports.io = io;

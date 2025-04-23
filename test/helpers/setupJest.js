// Polyfill TextEncoder and TextDecoder for JSDOM
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Set up any other global configurations for tests here
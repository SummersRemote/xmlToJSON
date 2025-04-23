// /**
//  * Custom Jest matchers for XMLJSONTransformer tests
//  */

// // Helper function to normalize XML strings for comparison
// function normalizeSpace(xml) {
//   return String(xml)
//     .replace(/\s+/g, "") // collapse all types of whitespace (spaces, tabs, newlines) into a single space
//     .trim(); // trim leading and trailing spaces
// }

// expect.extend({
//   // Custom matcher to compare normalized XML equality
//   toNormalizeEqual(received, expected) {
//     const receivedNormalized = normalizeSpace(received);
//     const expectedNormalized = normalizeSpace(expected);

//     const pass = receivedNormalized === expectedNormalized;

//     if (pass) {
//       return {
//         message: () =>
//           `expected ${received} not to normalize equal to ${expected}`,
//         pass: true,
//       };
//     } else {
//       return {
//         message: () =>
//           `expected ${received} to normalize equal to ${expected}\n\n` +
//           `Received: ${receivedNormalized}\n` +
//           `Expected: ${expectedNormalized}`,
//         pass: false,
//       };
//     }
//   },

//   // Custom matcher to check if normalized XML contains another XML
//   toNormalizeContain(received, expected) {
//     const receivedNormalized = normalizeSpace(received);
//     const expectedNormalized = normalizeSpace(expected);

//     const pass = receivedNormalized.includes(expectedNormalized);

//     if (pass) {
//       return {
//         message: () =>
//           `expected ${received} not to contain normalized version of ${expected}`,
//         pass: true,
//       };
//     } else {
//       return {
//         message: () =>
//           `expected ${received} to contain normalized version of ${expected}\n\n` +
//           `Received: ${receivedNormalized}\n` +
//           `Expected: ${expectedNormalized}`,
//         pass: false,
//       };
//     }
//   },
// });

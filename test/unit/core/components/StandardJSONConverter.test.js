import StandardJSONConverter from '../../../../src/core/components/StandardJSONConverter.js';

describe('StandardJSONConverter', () => {
  describe('convert', () => {
    test('should convert simple JSON with default root element', () => {
      // Arrange
      const standardJson = {
        name: 'Alice Johnson',
        age: 30,
        email: 'alice@example.com'
      };
      
      // Act
      const result = StandardJSONConverter.convert(standardJson);
      
      // Assert
      expect(result).toHaveProperty('root');
      
      const rootNode = result.root;
      expect(rootNode).toHaveProperty('@ns');
      expect(rootNode).toHaveProperty('@val');
      expect(rootNode).toHaveProperty('@attrs');
      expect(rootNode).toHaveProperty('@children');
      
      // Check children count
      expect(rootNode['@children'].length).toBe(3);
      
      // Check conversion of specific values
      const nameChild = rootNode['@children'].find(child => 'name' in child).name;
      const ageChild = rootNode['@children'].find(child => 'age' in child).age;
      
      expect(nameChild['@val']).toBe('Alice Johnson');
      expect(ageChild['@val']).toBe('30');
    });
    
    test('should convert JSON with custom root element name', () => {
      // Arrange
      const standardJson = {
        firstName: 'John',
        lastName: 'Doe'
      };
      
      // Act
      const result = StandardJSONConverter.convert(standardJson, 'person');
      
      // Assert
      expect(result).toHaveProperty('person');
      expect(result).not.toHaveProperty('root');
      
      const personNode = result.person;
      expect(personNode['@children'].length).toBe(2);
      
      const firstNameChild = personNode['@children'].find(child => 'firstName' in child).firstName;
      expect(firstNameChild['@val']).toBe('John');
    });
    
    test('should handle nested objects', () => {
      // Arrange
      const standardJson = {
        person: {
          name: 'Bob Smith',
          contact: {
            email: 'bob@example.com',
            phone: '555-1234'
          }
        }
      };
      
      // Act
      const result = StandardJSONConverter.convert(standardJson);
      
      // Assert
      const rootNode = result.root;
      
      // Find the person child node
      const personChild = rootNode['@children'].find(child => 'person' in child).person;
      expect(personChild['@children'].length).toBe(2);
      
      // Find the contact child node within person
      const contactChild = personChild['@children'].find(child => 'contact' in child).contact;
      expect(contactChild['@children'].length).toBe(2);
      
      // Check that values were converted correctly
      const emailChild = contactChild['@children'].find(child => 'email' in child).email;
      expect(emailChild['@val']).toBe('bob@example.com');
    });
    
    test('should handle arrays', () => {
      // Arrange
      const standardJson = {
        items: ['Apple', 'Banana', 'Cherry']
      };
      
      // Act
      const result = StandardJSONConverter.convert(standardJson);
      
      // Assert
      const rootNode = result.root;
      
      // Find the items child node
      const itemsChild = rootNode['@children'].find(child => 'items' in child).items;
      
      // Array should be converted to children with singular name (item)
      expect(itemsChild['@children'].length).toBe(3);
      
      // Check first item value
      const firstItem = itemsChild['@children'][0].item;
      expect(firstItem['@val']).toBe('Apple');
    });
    
    test('should handle arrays of objects', () => {
      // Arrange
      const standardJson = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' }
        ]
      };
      
      // Act
      const result = StandardJSONConverter.convert(standardJson);
      
      // Assert
      const rootNode = result.root;
      
      // Find the users child node
      const usersChild = rootNode['@children'].find(child => 'users' in child).users;
      
      // Should have two user items
      expect(usersChild['@children'].length).toBe(2);
      
      // Check properties of first user
      const firstUser = usersChild['@children'][0].user;
      expect(firstUser['@children'].length).toBe(2);
      
      const idChild = firstUser['@children'].find(child => 'id' in child).id;
      const nameChild = firstUser['@children'].find(child => 'name' in child).name;
      
      expect(idChild['@val']).toBe('1');
      expect(nameChild['@val']).toBe('Alice');
    });
    
    test('should handle detailed root element configuration', () => {
      // Arrange
      const standardJson = {
        value: 'test'
      };
      
      const rootConfig = {
        name: 'data',
        ns: 'http://example.org/data',
        prefix: 'ex',
        attributes: {
          id: '12345',
          type: 'test'
        }
      };
      
      // Act
      const result = StandardJSONConverter.convert(standardJson, rootConfig);
      
      // Assert
      expect(result).toHaveProperty('data');
      
      const dataNode = result.data;
      expect(dataNode['@ns']).toBe('http://example.org/data');
      expect(dataNode['@prefix']).toBe('ex');
      
      // Check attributes
      expect(dataNode['@attrs'].id['@val']).toBe('12345');
      expect(dataNode['@attrs'].type['@val']).toBe('test');
      
      // Check content was preserved
      const valueChild = dataNode['@children'].find(child => 'value' in child).value;
      expect(valueChild['@val']).toBe('test');
    });
    
    test('should handle attribute with namespace in detailed configuration', () => {
      // Arrange
      const standardJson = {
        content: 'Hello'
      };
      
      const rootConfig = {
        name: 'root',
        attributes: {
          type: {
            val: 'message',
            ns: 'http://example.org/attrs',
            prefix: 'ex'
          }
        }
      };
      
      // Act
      const result = StandardJSONConverter.convert(standardJson, rootConfig);
      
      // Assert
      const rootNode = result.root;
      
      // Check attribute with namespace
      expect(rootNode['@attrs'].type['@val']).toBe('message');
      expect(rootNode['@attrs'].type['@ns']).toBe('http://example.org/attrs');
      expect(rootNode['@attrs'].type['@prefix']).toBe('ex');
    });
    
    test('should handle null and undefined values', () => {
      // Arrange
      const standardJson = {
        definedValue: 'test',
        nullValue: null,
        undefinedValue: undefined
      };
      
      // Act
      const result = StandardJSONConverter.convert(standardJson);
      
      // Assert
      const rootNode = result.root;
      
      // Should have 3 children
      expect(rootNode['@children'].length).toBe(3);
      
      // Check null and undefined conversions
      const nullChild = rootNode['@children'].find(child => 'nullValue' in child).nullValue;
      const undefinedChild = rootNode['@children'].find(child => 'undefinedValue' in child).undefinedValue;
      
      expect(nullChild['@val']).toBe('');
      expect(undefinedChild['@val']).toBe('');
    });
  });
});
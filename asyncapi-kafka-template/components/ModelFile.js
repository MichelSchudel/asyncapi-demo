import { javaTypeName } from './spec.js';

export default function ModelFile({ schema, javaPackage }) {
  if (schema.type() === 'object') {
    return record(schema, javaPackage);
  }
  return enumType(schema, javaPackage);
}

function record(schema, javaPackage) {
  const typeName = schema.title();
  const properties = schema.properties();
  let needsListImport = false;
  const params = Object.entries(properties).map(([name, propertySchema]) => {
    const javaType = javaTypeName(propertySchema);
    needsListImport = needsListImport || javaType.startsWith('List<');
    return `        @JsonProperty("${name}") ${javaType} ${name}`;
  });

  return `package ${javaPackage};

import com.fasterxml.jackson.annotation.JsonProperty;
${needsListImport ? 'import java.util.List;\n' : ''}
public record ${typeName}(
${params.join(',\n')}
) {
}
`;
}

function enumType(schema, javaPackage) {
  const typeName = schema.title();
  const values = schema.enum();
  const constants = values.map((value) => `${value}("${value}")`).join(', ');

  return `package ${javaPackage};

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ${typeName} {

    ${constants};

    private final String value;

    ${typeName}(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static ${typeName} fromValue(String value) {
        for (${typeName} candidate : values()) {
            if (candidate.value.equals(value)) {
                return candidate;
            }
        }
        throw new IllegalArgumentException("Unexpected value '" + value + "'");
    }
}
`;
}

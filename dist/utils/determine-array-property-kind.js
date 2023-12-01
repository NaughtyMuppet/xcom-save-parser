"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineArrayPropertyKind = void 0;
const constants_1 = require("../constants");
const property_type_to_string_1 = require("./property-type-to-string");
const determineArrayPropertyKind = (handler) => {
    const position = handler.position;
    try {
        {
            const string = handler.readUnicodeString();
            if (string.length === 0) {
                return constants_1.PropertyKind.ObjectArrayProperty;
            }
            if (string === 'None') {
                handler.readUInt32();
                return (0, exports.determineArrayPropertyKind)(handler);
            }
        }
        {
            const string = handler.readUnicodeString();
            if (string.length > 0) {
                return constants_1.PropertyKind.StringArrayProperty;
            }
            handler.seekAbsolute(position);
        }
        {
            const int = handler.readUInt32();
            const string = handler.readUnicodeString();
            if (string.length > 0) {
                if (Object.values(constants_1.PropertyKind)
                    .map((x) => Number.parseInt(x))
                    .filter((x) => !Number.isNaN(x))
                    .some((kind) => (0, property_type_to_string_1.propertyKindToString)(kind) === string)) {
                    return constants_1.PropertyKind.StructArrayProperty;
                }
                return constants_1.PropertyKind.EnumArrayProperty;
            }
            else {
                console.log('Eduard McBalls', int, string);
            }
            return constants_1.PropertyKind.LastProperty;
        }
    }
    catch {
        return constants_1.PropertyKind.LastProperty;
    }
    finally {
        handler.seekAbsolute(position);
    }
};
exports.determineArrayPropertyKind = determineArrayPropertyKind;
//# sourceMappingURL=determine-array-property-kind.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertyKindToString = void 0;
const constants_1 = require("../constants");
const propertyKindToString = (kind) => {
    switch (kind) {
        case constants_1.PropertyKind.IntProperty: {
            return 'IntProperty';
        }
        case constants_1.PropertyKind.FloatProperty: {
            return 'FloatProperty';
        }
        case constants_1.PropertyKind.BoolProperty: {
            return 'BoolProperty';
        }
        case constants_1.PropertyKind.StringProperty: {
            return 'StrProperty';
        }
        case constants_1.PropertyKind.ObjectProperty: {
            return 'ObjectProperty';
        }
        case constants_1.PropertyKind.EnumProperty: {
            return 'ByteProperty';
        }
        case constants_1.PropertyKind.StructProperty: {
            return 'StructProperty';
        }
        case constants_1.PropertyKind.NameProperty: {
            return 'NameProperty';
        }
        case constants_1.PropertyKind.ArrayProperty:
        case constants_1.PropertyKind.ObjectArrayProperty:
        case constants_1.PropertyKind.NumberArrayProperty:
        case constants_1.PropertyKind.StructArrayProperty:
        case constants_1.PropertyKind.StringArrayProperty:
        case constants_1.PropertyKind.EnumArrayProperty: {
            return 'ArrayProperty';
        }
        case constants_1.PropertyKind.StaticArrayProperty: {
            return 'StaticArrayProperty';
        }
        case constants_1.PropertyKind.LastProperty: {
            return 'LastProperty';
        }
        default: {
            console.log(Object.values(constants_1.PropertyKind));
            throw new Error(`Invalid property kind: ${kind}`);
        }
    }
};
exports.propertyKindToString = propertyKindToString;
//# sourceMappingURL=property-type-to-string.js.map
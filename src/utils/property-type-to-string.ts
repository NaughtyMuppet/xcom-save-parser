import { PropertyKind } from '../constants';
export const propertyKindToString = (kind: PropertyKind) => {
    switch (kind) {
        case PropertyKind.IntProperty: {
            return 'IntProperty';
        }
        case PropertyKind.FloatProperty: {
            return 'FloatProperty';
        }
        case PropertyKind.BoolProperty: {
            return 'BoolProperty';
        }
        case PropertyKind.StringProperty: {
            return 'StrProperty';
        }
        case PropertyKind.ObjectProperty: {
            return 'ObjectProperty';
        }
        case PropertyKind.EnumProperty: {
            return 'ByteProperty';
        }
        case PropertyKind.StructProperty: {
            return 'StructProperty';
        }
        case PropertyKind.NameProperty: {
            return 'NameProperty';
        }
        case PropertyKind.ArrayProperty:
        case PropertyKind.ObjectArrayProperty:
        case PropertyKind.NumberArrayProperty:
        case PropertyKind.StructArrayProperty:
        case PropertyKind.StringArrayProperty:
        case PropertyKind.EnumArrayProperty: {
            return 'ArrayProperty';
        }
        case PropertyKind.StaticArrayProperty: {
            return 'StaticArrayProperty';
        }
        case PropertyKind.LastProperty: {
            return 'LastProperty';
        }
        default: {
            console.log(Object.values(PropertyKind));
            throw new Error(`Invalid property kind: ${kind}`);
        }
    }
};

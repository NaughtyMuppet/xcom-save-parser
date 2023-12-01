"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyKind = exports.COMPRESSED_DATA_OFFSET = exports.UPK_MAGIC_NUMBER = void 0;
exports.UPK_MAGIC_NUMBER = 2653586369;
exports.COMPRESSED_DATA_OFFSET = 1024;
var PropertyKind;
(function (PropertyKind) {
    PropertyKind[PropertyKind["IntProperty"] = 1] = "IntProperty";
    PropertyKind[PropertyKind["FloatProperty"] = 2] = "FloatProperty";
    PropertyKind[PropertyKind["BoolProperty"] = 3] = "BoolProperty";
    PropertyKind[PropertyKind["StringProperty"] = 4] = "StringProperty";
    PropertyKind[PropertyKind["ObjectProperty"] = 5] = "ObjectProperty";
    PropertyKind[PropertyKind["NameProperty"] = 6] = "NameProperty";
    PropertyKind[PropertyKind["EnumProperty"] = 7] = "EnumProperty";
    PropertyKind[PropertyKind["StructProperty"] = 8] = "StructProperty";
    PropertyKind[PropertyKind["ArrayProperty"] = 9] = "ArrayProperty";
    PropertyKind[PropertyKind["ObjectArrayProperty"] = 10] = "ObjectArrayProperty";
    PropertyKind[PropertyKind["NumberArrayProperty"] = 11] = "NumberArrayProperty";
    PropertyKind[PropertyKind["StructArrayProperty"] = 12] = "StructArrayProperty";
    PropertyKind[PropertyKind["StringArrayProperty"] = 13] = "StringArrayProperty";
    PropertyKind[PropertyKind["EnumArrayProperty"] = 14] = "EnumArrayProperty";
    PropertyKind[PropertyKind["StaticArrayProperty"] = 15] = "StaticArrayProperty";
    PropertyKind[PropertyKind["LastProperty"] = 16] = "LastProperty";
})(PropertyKind || (exports.PropertyKind = PropertyKind = {}));
//# sourceMappingURL=constants.js.map
export const UPK_MAGIC_NUMBER = 0x9e_2a_83_c1;
export const COMPRESSED_DATA_OFFSET = 1024;

export enum PropertyKind {
    IntProperty = 1,
    FloatProperty = 2,
    BoolProperty = 3,
    StringProperty = 4,
    ObjectProperty = 5,
    NameProperty = 6,
    EnumProperty = 7,
    StructProperty = 8,
    ArrayProperty = 9,
    ObjectArrayProperty = 10,
    NumberArrayProperty = 11,
    StructArrayProperty = 12,
    StringArrayProperty = 13,
    EnumArrayProperty = 14,
    StaticArrayProperty = 15,
    LastProperty = 16
}

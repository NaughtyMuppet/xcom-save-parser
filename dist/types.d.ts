/// <reference types="node" />
import { PropertyKind } from './constants';
export declare namespace Property {
    interface PropertyBase {
        kind: PropertyKind;
        name: string;
        size: number;
    }
    export interface StaticArrayProperty extends PropertyBase {
        kind: PropertyKind.StaticArrayProperty;
        value: any[];
    }
    export interface ObjectProperty extends PropertyBase {
        kind: PropertyKind.ObjectProperty;
        value: number;
    }
    export interface IntProperty extends PropertyBase {
        kind: PropertyKind.IntProperty;
        value: number;
    }
    export interface FloatProperty extends PropertyBase {
        kind: PropertyKind.FloatProperty;
        value: number;
    }
    export interface BoolProperty extends PropertyBase {
        kind: PropertyKind.BoolProperty;
        value: boolean;
    }
    export interface EnumProperty extends PropertyBase {
        kind: PropertyKind.EnumProperty;
        value: {
            name: string;
            value: number;
        };
    }
    export interface StringProperty extends PropertyBase {
        kind: PropertyKind.StringProperty;
        value: string;
    }
    export interface ObjectArrayProperty extends PropertyBase {
        kind: PropertyKind.ObjectArrayProperty;
        value: number[];
    }
    export interface NumberArrayProperty extends PropertyBase {
        kind: PropertyKind.NumberArrayProperty;
        value: number[];
    }
    export interface StringArrayProperty extends PropertyBase {
        kind: PropertyKind.StringArrayProperty;
        value: string[];
    }
    export interface UnknownProperty extends PropertyBase {
        kind: PropertyKind.LastProperty;
        value: any;
    }
    export interface StructProperty extends PropertyBase {
        structName: string;
        kind: PropertyKind.StructProperty;
        value: Buffer;
    }
    export interface StructArrayProperty extends PropertyBase {
        kind: PropertyKind.StructArrayProperty;
        value: any[];
    }
    export interface EnumArrayProperty extends PropertyBase {
        kind: PropertyKind.EnumArrayProperty;
        value: {
            name: string;
            value: number;
        }[];
    }
    export interface NameProperty extends PropertyBase {
        kind: PropertyKind.NameProperty;
        value: {
            string: string;
            number: number;
        };
    }
    export type AnyProperty = BoolProperty | EnumProperty | FloatProperty | IntProperty | NameProperty | ObjectProperty | StringProperty | StructProperty | EnumArrayProperty | NumberArrayProperty | ObjectArrayProperty | StaticArrayProperty | StringArrayProperty | StructArrayProperty | UnknownProperty;
    export {};
}

import { PropertyKind } from '../constants';
import { DataHandler } from './data-handler';
import { propertyKindToString } from './property-type-to-string';

export const determineArrayPropertyKind = (handler: DataHandler): PropertyKind => {
    const position = handler.position;
    try {
        {
            const string = handler.readUnicodeString();
            if (string.length === 0) {
                return PropertyKind.ObjectArrayProperty;
            }
            if (string === 'None') {
                handler.readUInt32();
                return determineArrayPropertyKind(handler);
            }
        }
        {
            const string = handler.readUnicodeString();
            if (string.length > 0) {
                return PropertyKind.StringArrayProperty;
            }
            handler.seekAbsolute(position);
        }
        {
            const int = handler.readUInt32();
            const string = handler.readUnicodeString();
            if (string.length > 0) {
                if (
                    Object.values(PropertyKind)
                        .map((x) => Number.parseInt(x as any))
                        .filter((x) => !Number.isNaN(x))
                        .some((kind) => propertyKindToString(kind as PropertyKind) === string)
                ) {
                    return PropertyKind.StructArrayProperty;
                }
                return PropertyKind.EnumArrayProperty;
            } else {
                console.log('Eduard McBalls', int, string);
            }
            return PropertyKind.LastProperty;
        }
    } catch {
        return PropertyKind.LastProperty;
    } finally {
        handler.seekAbsolute(position);
    }
};

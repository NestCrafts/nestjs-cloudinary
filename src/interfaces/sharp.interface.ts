import * as sharp from 'sharp';

export interface ISharpInputOptions {
	width?: number;
	height?: number;
	options?: sharp.SharpOptions;
}

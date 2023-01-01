/* eslint-disable import/named */
import { Readable } from 'node:stream';

import { Inject, Injectable, Logger } from '@nestjs/common';
import {
	UploadApiErrorResponse,
	UploadApiOptions,
	UploadApiResponse,
	v2 as cloudinary,
} from 'cloudinary';
import sharp from 'sharp';

import { CloudinaryModuleOptions } from './cloudinary.options';
import { IFile, ISharpInputOptions } from './interfaces';
import { MODULE_OPTIONS_TOKEN } from './cloudinary.module-definition';

@Injectable()
export class CloudinaryService {
	private logger = new Logger(CloudinaryService.name);

	constructor(
		@Inject(MODULE_OPTIONS_TOKEN)
		private readonly options: CloudinaryModuleOptions,
	) {}

	/**
	 * It takes a file, uploads it to cloudinary, and returns a promise
	 * @param {IFile} file - IFile - This is the file object that is passed to the uploadFile method.
	 * @param {UploadApiOptions} [options] - This is the options object that you can pass to the
	 * uploader.upload_stream method.
	 * @param {ISharpInputOptions} [sharpOptions] - This is an object that contains the options for sharp.
	 * @returns | UploadApiResponse
	 * 						| UploadApiErrorResponse
	 * 						| PromiseLike<UploadApiResponse | UploadApiErrorResponse>,
	 */
	async uploadFile(
		file: IFile,
		options?: UploadApiOptions,
		sharpOptions?: ISharpInputOptions,
	): Promise<UploadApiResponse | UploadApiErrorResponse> {
		return new Promise(async (resolve, reject) => {
			cloudinary.config({
				cloud_name: this.options.cloudName,
				api_key: this.options.apiKey,
				api_secret: this.options.apiSecret,
			});

			const upload = cloudinary.uploader.upload_stream(
				options,
				(
					error: any,
					result:
						| UploadApiResponse
						| UploadApiErrorResponse
						| PromiseLike<UploadApiResponse | UploadApiErrorResponse>,
				) => {
					if (error) {
						this.logger.error(error);

						return reject(error);
					} else {
						resolve(result);
					}
				},
			);

			const stream: Readable = new Readable();

			if (sharpOptions && file.mimetype.match(/^image/)) {
				const options = { width: 800, ...sharpOptions };
				const shrinkedImage = await sharp(file.buffer)
					.resize(options)
					.toBuffer();

				stream.push(shrinkedImage);
			} else {
				stream.push(file.buffer);
			}
			stream.push(null);

			stream.pipe(upload);
		});
	}
}

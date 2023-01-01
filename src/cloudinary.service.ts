/* eslint-disable import/named */
import { Readable } from 'node:stream';

import { Inject, Injectable, Logger } from '@nestjs/common';
import {
	ResourceType,
	UploadApiErrorResponse,
	UploadApiOptions,
	UploadApiResponse,
	v2 as cloudinary,
} from 'cloudinary';
import sharp from 'sharp';

import { CloudinaryModuleOptions } from './cloudinary.options';
import {
	IFile,
	ISharpInputOptions,
	ISignedUploadUrlOptions,
} from './interfaces';
import { MODULE_OPTIONS_TOKEN } from './cloudinary.module-definition';
import { defaultCreateSignedUploadUrlOptions } from './cloudinary.constant';

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

	/**
	 * It returns a signed upload URL.
	 * @see https://cloudinary.com/documentation/signatures#using_cloudinary_backend_sdks_to_generate_sha_authentication_signatures
	 * @param {string} publicId - This is the public id of the file.
	 * @param {ResourceType} resourceType - The type of the resource. See ./node_modules/cloudinary/types/index.d.ts
	 * @param {ISignedUploadUrlOptions} [options] - This is an object that contains the options for signing.
	 * @returns string
	 */
	async createSignedUploadUrl(
		publicId: string,
		resourceType: ResourceType,
		options?: ISignedUploadUrlOptions,
	) {
		options = { ...defaultCreateSignedUploadUrlOptions, ...options };

		const cloudName = this.options.cloud_name;
		const apiKey = this.options.api_key;
		const apiSecret = this.options.api_secret;

		const url = `https://api.cloudinary.com/v1_1/${this.options.cloud_name}/${resourceType}/upload`;
		const timestamp = Math.floor(Date.now() / 1000).toString();

		cloudinary.config({
			cloud_name: cloudName,
			api_key: apiKey,
			api_secret: apiSecret,
		});

		const signature = await cloudinary.utils.api_sign_request(
			{
				timestamp,
				folder: options.folder,
				eager: options.eager,
				public_id: publicId,
			},
			this.options.api_secret,
		);

		return {
			url,
			publicId,
			apiKey,
			timestamp,
			eager: options.eager,
			folder: options.folder,
			signature,
		};
	}
}

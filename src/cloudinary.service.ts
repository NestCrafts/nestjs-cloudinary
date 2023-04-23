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
	public readonly cloudinary = cloudinary;

	constructor(
		@Inject(MODULE_OPTIONS_TOKEN)
		private readonly options: CloudinaryModuleOptions,
	) {
		this.cloudinary.config(Object.assign({}, options));
	}

	pingCloudinary() {
		cloudinary.api
			.ping()
			.then(res => {
				this.logger.log(`Cloudinary connection ${res.status}`);
			})
			.catch(err => {
				this.logger.warn('Cloudinary connection failed.');
				this.logger.error(err.error);
			});
	}

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
			cloudinary.api.ping;
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

		const url = `https://api.cloudinary.com/v1_1/${this.options.cloud_name}/${resourceType}/upload`;
		const timestamp = Math.floor(Date.now() / 1000).toString();

		const signature = this.cloudinary.utils.api_sign_request(
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
			apiKey: this.options.api_key,
			timestamp,
			eager: options.eager,
			folder: options.folder,
			signature,
		};
	}

	/**
	 * It returns the cloudinary instance.
	 * @returns The cloudinary instance.
	 */
	get cloudinaryInstance() {
		return this.cloudinary;
	}
}

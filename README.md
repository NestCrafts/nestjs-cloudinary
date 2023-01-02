<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="http://kamilmysliwiec.com/public/nest-logo.png#1" alt="Nest Logo" />   </a>
  <a href="https://min.io" target="_blank"><img src="https://i.imgur.com/1UkYh1o.png" width="150"></a>
</p>

<p align="center">Cloudinary Module for Nest framework</p>

<p align="center">
<a href="https://www.npmjs.com/package/nestjs-cloudinary"><img src="https://img.shields.io/npm/v/nestjs-cloudinary" alt="NPM Version" /></a>
<a href="https://img.shields.io/npm/l/nestjs-cloudinary"><img src="https://img.shields.io/npm/l/nestjs-cloudinary" alt="Package License" /></a>
<a href="https://www.npmjs.com/package/nestjs-cloudinary"><img src="https://img.shields.io/npm/dw/nestjs-cloudinary" alt="NPM Downloads" /></a>

</p>

<p align="center">
<a href="https://www.buymeacoffee.com/XbgWxt567" target="_blank"><img src="https://i.imgur.com/CahshSS.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>

</p>

## Description

This's a [nest-cloudinary](https://github.com/rubiin/nest-cloudinary) module for [Nest](https://github.com/nestjs/nest).
This quickstart guide will show you how to install the client SDK and execute an example JavaScript program. For a complete list of APIs and examples, please take a look at the [JavaScript Client API Reference](https://docs.min.io/docs/javascript-client-api-reference) documentation.

This document assumes that you have a working [nodejs](http://nodejs.org/) setup in place.

## Installation

```bash
$ npm i --save nestjs-cloudinary
```

## Initialize cloudinary Client

Provide the credentials for cloudinary module by importing it. More options can be passed as per the [cloudinary documentation](https://cloudinary.com/documentation/node_integration#configuration_parameters).

```javascript
import { Module } from '@nestjs/common';
import { CloudinaryModule } from 'nestjs-cloudinary';

@Module({
	imports: [
		CloudinaryModule.forRootAsync({
			imports: [NestConfigModule],
			useFactory: (configService: ConfigService) => ({
				isGlobal: true,
				cloud_name: configService.get('cloudinary.cloudName'),
				api_key: configService.get('cloudinary.apiKey'),
				api_secret: configService.get('cloudinary.apiSecret'),
			}),
			inject: [ConfigService],
		}),
	],
})
export class NestCloudinaryClientModule {}
```

Then you can use it in the controller or service by injecting it in the controller as:

```typescript
import { CloudinaryService } from 'nestjs-cloudinary';

constructor(private readonly cloudinaryService: CloudinaryService ) {}

```

## Quick Start Example - File Uploader

This example program connects to cloudinary storage server then uploads a file.

```typescript
import { Controller, Get, Inject } from '@nestjs/common';
import { CloudinaryService } from 'nestjs-cloudinary';

@Controller()
export class NestCloudinaryClientController {
	constructor(private readonly cloudinaryService: CloudinaryService) {}
	@Post('upload')
	@UseInterceptors(FileInterceptor('file'))
	async uploadFile(@UploadedFile() file: Express.Multer.File) {
		return this.cloudinaryService.upload(file);
	}
}
```

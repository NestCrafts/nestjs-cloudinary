import { Module, OnModuleInit } from '@nestjs/common';

import { ConfigurableModuleClass } from './cloudinary.module-definition';
import { CloudinaryService } from './cloudinary.service';

@Module({
	providers: [CloudinaryService],
	exports: [CloudinaryService],
})
export class CloudinaryModule
	extends ConfigurableModuleClass
	implements OnModuleInit
{
	constructor(private readonly service: CloudinaryService) {
		super();
	}
	async onModuleInit() {
		this.service.pingCloudinary();
	}
}

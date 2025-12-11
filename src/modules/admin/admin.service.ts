import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {}

  async create(createSettingDto: CreateSettingDto): Promise<Setting> {
    const existingSetting = await this.settingsRepository.findOne({
      where: { key: createSettingDto.key },
    });

    if (existingSetting) {
      throw new ConflictException(`Setting with key ${createSettingDto.key} already exists`);
    }

    const setting = this.settingsRepository.create(createSettingDto);
    return this.settingsRepository.save(setting);
  }

  async findAll(): Promise<Setting[]> {
    return this.settingsRepository.find();
  }

  async findByKey(key: string): Promise<Setting> {
    const setting = await this.settingsRepository.findOne({ where: { key } });

    if (!setting) {
      throw new NotFoundException(`Setting with key ${key} not found`);
    }

    return setting;
  }

  async update(key: string, updateSettingDto: UpdateSettingDto): Promise<Setting> {
    const setting = await this.findByKey(key);
    await this.settingsRepository.update(setting.id, updateSettingDto);
    return this.findByKey(key);
  }

  async remove(key: string): Promise<void> {
    const setting = await this.findByKey(key);
    await this.settingsRepository.remove(setting);
  }
}

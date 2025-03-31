import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/user.dto';
import { hash } from 'bcrypt';
import { LoggingInterceptor } from 'src/config/loggingInterceptor';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}
  private readonly logger = new LoggingInterceptor();

  async create(dto: CreateUserDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (user) throw new ConflictException('Email already exists');

    const hashedPassword = await hash(dto.password, 10);
    const newUser = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });

    await this.userRepository.save(newUser);
    const { password, ...result } = newUser;
    return result;
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  async findAll(page: number = 1, size: number = 10) {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * size, // Calculate offset
      take: size, // Limit results per page
      order: { id: 'DESC' }, // Sort by ID in descending order (optional)
    });
    this.logger.log("Refresh user table", UserService.name, users);

  
    return {
      data: users,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }
}

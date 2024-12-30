import { Injectable } from '@nestjs/common';
import { PageOptionsDto } from '../common/dtos/page-options.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}
  async create(createUserDto: CreateUserDto) {
    const { data } = await this.supabase.admin.createUser({
      email: createUserDto.email,
      password: createUserDto.password,
      user_metadata: {
        name: createUserDto.name,
      },
      email_confirm: true,
    });
    return data;
  }

  async findAll(pageOptionsDto: PageOptionsDto) {
    const { data } = await this.supabase.admin.listUsers({
      page: pageOptionsDto.page,
      perPage: pageOptionsDto.take,
    });

    // const itemCount = (data as Pagination).total;

    // const meta = new PageMetaDto({ pageOptionsDto, itemCount });

    return data;
  }

  async findOne(id: string) {
    const { data } = await this.supabase.admin.getUserById(id);
    return data;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { data } = await this.supabase.admin.updateUserById(id, {
      email: updateUserDto.email,
      user_metadata: { name: updateUserDto.name },
      ...(updateUserDto.password && { password: updateUserDto.password }),
      email_confirm: true,
    });
    return data;
  }

  async remove(id: string) {
    const { data } = await this.supabase.admin.deleteUser(id);
    return data;
  }

  async updateProfilePhoto(userId: string, file: Express.Multer.File) {
    const uploadResult = await this.supabase
      .getSupabase()
      .storage.from('profile')
      .upload('avatar.png', file.buffer.toString('base64'), {
        contentType: file.mimetype,
      });
    console.log(uploadResult);
    if (uploadResult.data) {
      const { data } = await this.supabase.admin.updateUserById(userId, {
        user_metadata: { avatar: uploadResult.data.path },
      });
      return data;
    } else {
      return false;
    }
  }
}



export interface UserDto {
  id?: number;

  name: string;

  lastName: string;

  phone: string;

  email: string;

  password: string;

  role?: {
    id: number;
    name: 'ADMIN' | 'CLIENT_PRO' | 'CLIENT';
    permissions?: Array<any>;
  };

  image?: string;
}


export interface UserUpdateDto {
  name?: string;

  lastName?: string;

  phone?: string;

  role?: {
    id: number;
    name: 'ADMIN' | 'CLIENT_PRO' | 'CLIENT';
    permissions?: Array<any>;
  };
}

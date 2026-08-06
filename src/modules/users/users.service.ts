import { Service } from "@/modules/core/service"

export class UsersService extends Service {
  constructor() {
    super("users")
  }
}

export const usersService = new UsersService()

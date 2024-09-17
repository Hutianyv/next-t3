"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { type Task } from "@prisma/client";
import {
  createTaskZodSchema,
  type createTaskZodSchemaType,
} from "@/schema/createTask";

export async function createTask(data: createTaskZodSchemaType) {
  const user = await currentUser();

  if (!user) {
    throw new Error("用户未登录，请先登录");
  }

  const result = createTaskZodSchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      message: result.error.flatten().fieldErrors,
    };
  }

  const { content, expiresAt, todoId } = data;

  await prisma.task.create({
    data: {
      userId: user.id,
      content,
      expiresAt,
      list: {
        connect: {
          id: todoId,
        },
      },
    },
  });

  revalidatePath("/");
}

export async function setTaskDone(task: Task) {
  const user = await currentUser();

  if (!user) {
    throw new Error("用户未登录，请先登录");
  }

  await prisma.task.update({
    where: {
      id: task.id,
      userId: user.id,
    },
    data: {
      done: !task.done,
    },
  });

  revalidatePath("/");
}

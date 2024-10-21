import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const tasks = await prisma.task.findMany()
      res.status(200).json(tasks)
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return new Response(JSON.stringify({ message: 'Error fetching tasks' }), { status: 500 });
    }
  } else if (req.method === 'POST') {
    try {
      const task = await prisma.task.create({
        data: req.body,
      })
      res.status(201).json(task)
    } catch (error) {
      console.error('Error creating task:', error);
      return new Response(JSON.stringify({ message: 'Error creating task' }), { status: 500 });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

// (Core)

// (Dev)
import { IContext, IUser } from '../../common/interfaces/public.interface';
import { TicketModel } from '../../models/ticket/schema';
import { PublicMessages } from '../../common/enums/public.enum';
import { cancelButton, mainPanelKeyboard, ticketControllerKeyboard } from '../../common/keyboards/public.keyboard';
import { handleError, isCancelRequest, cancelRequest, toLocalDateString } from '../../utils/functions.util';
import { TFindDocument } from '../../common/types/public.type';
import { UserModel } from '../../models/user/schema';

// (Third-party)
import { Scenes } from 'telegraf';
import { ExtraPhoto, ExtraReplyMessage } from 'telegraf/typings/telegram-types';

const sentTicketScene = new Scenes.WizardScene<IContext>(
  'send-ticket-scene',

  async (ctx) => {
    try {
      // Fetch the user's open ticket count
      const open_ticket_count: number = await TicketModel.countDocuments({
        telegram_id: ctx.from.id,
        status: 'open',
      }).exec();

      // Check if there is already 2 open ticket
      if (open_ticket_count >= 2) {
        await cancelRequest(ctx, PublicMessages.CAN_SENT_TICKET);
        return;
      }

      // Prompt the user to ask for the ticket title
      await ctx.reply(PublicMessages.ASK_TICKET_TITLE, {
        reply_markup: {
          keyboard: cancelButton,
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });

      // Move to the next step in the wizard
      return ctx.wizard.next();
    } catch (error) {
      // Handle the error using the custom error handler
      await handleError(ctx, error);
    }
  },

  async (ctx) => {
    try {
      let text: string;

      // Verify the message contains text; otherwise, prompt correct format and return to the previous step
      if (ctx.message && 'text' in ctx.message) {
        text = ctx.message.text;
      } else {
        await ctx.reply(PublicMessages.WRONG_FORMAT);
        ctx.wizard.selectStep(1);
        return;
      }

      // Check if the user has a request to cancel the process
      if (isCancelRequest(text)) {
        await cancelRequest(ctx, PublicMessages.CANCEL_REQUEST);
        return;
      }

      // Set title in ticket_data
      ctx.scene.session.ticket_data = {
        title: text,
        text: null,
        photo_id: null,
      };

      // Prompt the user to ask for the ticket content
      await ctx.reply(PublicMessages.ASK_TICKET_TEXT);

      return ctx.wizard.next();
    } catch (error) {
      await handleError(ctx, error);
    }
  },

  async (ctx) => {
    try {
      const { session } = ctx.scene;

      // Process User Input (Photo or Text)
      if (ctx.message && 'photo' in ctx.message) {
        // Store photo caption and ID if a photo is sent
        session.ticket_data = {
          ...session.ticket_data,
          text: ctx.message.caption,
          photo_id: ctx.message.photo[3]?.file_id,
        };
      } else if (ctx.message && 'text' in ctx.message) {
        // Store text message
        session.ticket_data.text = ctx.text;
      } else {
        // Send error if the format is wrong
        await ctx.reply(PublicMessages.WRONG_FORMAT);
        ctx.wizard.selectStep(2);
        return;
      }
      const { title, text, photo_id } = session.ticket_data;

      // Check if the user has a request to cancel the process
      if (isCancelRequest(text)) {
        await cancelRequest(ctx, PublicMessages.CANCEL_REQUEST);
        return;
      }

      if (!text) {
        await ctx.reply(PublicMessages.TICKET_TEXT_IS_REQUIRED);
        ctx.wizard.selectStep(2);
        return;
      }

      // Retrieve User and Owners from Database
      const [user, owners]: [user: TFindDocument<IUser>, owners: TFindDocument<IUser>] = await Promise.all([
        UserModel.findOne({
          telegram_id: ctx.from.id,
        }).exec(),
        UserModel.find({ role: 'Owner' }).exec(),
      ]);

      // Create a New Ticket in the Database
      const ticket = await TicketModel.create({
        user_id: user._id,
        telegram_id: ctx.from.id,
        title,
        conversation: [{ sender: user.role === 'User' ? 'کاربر' : 'پشتیبان', text }],
        photo_id,
        status: 'open',
      });

      // Prepare Notification Message for Owners
      const ticketChat: string = ticket.conversation
        .map(({ sender, text }) => {
          return `${sender}: ${text}`;
        })
        .join('\n\n');
      const message: string = `*تیکت جدید در انتظار پاسخگویی*\n\nاطلاعات کاربر\nنام و نام‌خانوادگی: ${user.full_name}\nشماره تماس: ${user.phone}\n\nاطلاعات تیکت\nموضوع تیکت: ${ticket.title}\n\n${ticketChat}\n\n\nتاریخ ارسال: ${toLocalDateString(ticket.createdAt)}`;

      // Notify All Owners about the New Ticket
      const sendNotification = owners.map((owner) => {
        const options: ExtraPhoto | ExtraReplyMessage = {
          caption: message,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: ticketControllerKeyboard(ticket._id),
          },
        };

        if (photo_id) {
          ctx.telegram.sendPhoto(owner.telegram_id, photo_id, options);
          return;
        } else {
          ctx.telegram.sendMessage(owner.telegram_id, message, options);
          return;
        }
      });
      await Promise.all(sendNotification); // Execute all promises concurrently

      //  Confirm Ticket Creation to User
      await ctx.reply(PublicMessages.TICKET_SENT, {
        reply_markup: { keyboard: mainPanelKeyboard, resize_keyboard: true, one_time_keyboard: true },
      });

      // Exit the current scene
      return ctx.scene.leave();
    } catch (error) {
      await handleError(ctx, error);
    }
  }
);

export default sentTicketScene;

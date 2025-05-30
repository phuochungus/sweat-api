import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirestoreListenerService implements OnModuleInit {
  private readonly logger = new Logger(FirestoreListenerService.name);
  private db: FirebaseFirestore.Firestore;

  onModuleInit() {
    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
    this.db = admin.firestore();
    this.listenForMessages();
  }

  private listenForMessages() {
    this.db.collectionGroup('messages').onSnapshot(async (snapshot) => {
      const changes = snapshot.docChanges();

      for (const change of changes) {
        if (change.type === 'added') {
          const messageData = change.doc.data();
          const chatId = change.doc.ref.parent.parent?.id;

          if (!chatId) continue;

          // Only notify if not already notified
          if (messageData.notified) continue;

          // Get chat document to find participants
          const chatDoc = await this.db.collection('chats').doc(chatId).get();
          const chatData = chatDoc.data();

          if (!chatData?.participants) continue;

          // Find the recipient (the other participant)
          const recipientId = chatData.participants.find(
            (id) => id !== messageData.senderId,
          );

          if (!recipientId) continue;

          // Get recipient's FCM token
          const recipientDoc = await this.db
            .collection('users')
            .doc(recipientId)
            .get();
          const recipientData = recipientDoc.data();
          const fcmToken = recipientData?.fcmToken;

          if (!fcmToken) {
            continue;
          }
          const senderData = chatData.users[messageData.senderId];

          const senderName = senderData?.fullname || 'Someone';

          // Send push notification
          try {
            await admin.messaging().send({
              token: fcmToken,
              notification: {
                title: senderName,
                body: messageData.text,
              },
              data: {
                chatId,
                messageId: change.doc.id,
                type: 'chat_messages',
                senderData: JSON.stringify({
                  username: senderName,
                  chatId,
                  avatarUrl: senderData?.avatarUrl || '',
                  otherUserId: messageData.senderId,
                }),
              },
              android: {
                priority: 'high',
                notification: {
                  sound: 'default',
                  channelId: 'chat_messages',
                },
              },
              apns: {
                payload: {
                  aps: {
                    sound: 'default',
                    badge: 1,
                  },
                },
              },
            });
          } catch (error) {
          } finally {
            await change.doc.ref.update({ notified: true });
          }
        }
      }
    });
  }
}

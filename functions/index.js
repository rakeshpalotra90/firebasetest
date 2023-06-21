const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

const {
    initializeApp,
    applicationDefault,
    cert
} = require('firebase-admin/app');
const {
    getFirestore,
    Timestamp,
    FieldValue,
    Filter
} = require('firebase-admin/firestore');

admin.initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();


exports.sendToken = functions.https.onRequest((request, response) => {

    // Extract necessary data from the request
    const {
        userId,
        token
    } = request.body;
    console.log(request.body);

    let res;
    
        const userRef = db.collection('Receiver').doc(userId);
        res = userRef.update({
            token: request.body.token
        });


    if (res) {
        response.status(200).send({'message':"Token updated successfully",'data':[], 'error':false});
    } else {
        response.status(200).send({'message':"Token not updated",'data':[], 'error':true});
    }

});


exports.sendMessage = functions.https.onRequest((request, response) => {
    // Extract necessary data from the request
    const {
        recipientId,
        message,
        senderId
    } = request.body;

    // Send the message to the recipient
    // Implement your logic to send the message using FCM or other messaging service
    var newData = {
        message: message,
        from: senderId,
        creatAt: new Date(),
        to: recipientId

    };
    const res = db.collection('Messages').doc().set(newData);
    if (res) {

        // geting token data for reciver user
        const snapshot = await db.collection('Receiver').get();
        const recdocuments = snapshot.docs.map((doc) => doc.data());

        
        const payload = {
            token: recdocuments[0].token, //FCMToken
            notification: {
                title: 'cloud function demo',
                body: message
            },
            data: {
                body: message,
            }
        };

        admin.messaging().send(payload).then((response) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', response);
            return {
                success: true
            };
        }).catch((error) => {
            return {
                error: error.code
            };
        });
        response.status(200).send({'message':"'Message sent successfully'",'data':[], 'error':false});
    }else{

        response.status(201).send({'message':"Message not sent",'data':[], 'error':true});
    }


    
});

exports.receiveMessage =  functions.https.onRequest(async (request, response) => {
    // Extract necessary data from the request
    const {
        senderId,
        recipientId
    } = request.body;
    
    const snapshot = await db.collection('Messages').get();
    const documents = snapshot.docs.map((doc) => doc.data());

    response.status(200).send({'message':"Record found",'data':documents, 'error':''});


});
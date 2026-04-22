import { type NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import nodemailer from "nodemailer"


const STUDENTS_COLLECTION = "Students "


if (!getApps().length) {
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_TSEC_APP) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_TSEC_APP environment variable is not set")
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_TSEC_APP);
    initializeApp({
      credential: cert(serviceAccount),
    })
  } catch (error) {
    console.error("Firebase initialization error:", error)
    throw new Error("Failed to initialize Firebase")
  }
}

const auth = getAuth()
const db = getFirestore()

function generatePassword(): string {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const digits = "0123456789"
  const specialChars = "!@#$%^&*"
  const allChars = letters + digits + specialChars

  let password = ""

  password += digits[Math.floor(Math.random() * digits.length)]
  password += digits[Math.floor(Math.random() * digits.length)]
  password += specialChars[Math.floor(Math.random() * specialChars.length)]

  for (let i = 3; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("")
}

async function ensureCollectionsExist() {
  try {
    const studentsRef = db.collection(STUDENTS_COLLECTION)
    const studentsSnapshot = await studentsRef.limit(1).get()

    if (studentsSnapshot.empty) {
      console.log("Students collection doesn't exist, it will be created with first document")
    }
  } catch (error) {
    console.error("Error ensuring collections exist:", error)
    throw error
  }
}

interface StudentData {
  name?: string
  firstName?: string
  middleName?: string
  lastName?: string
  email: string
  branch: string
  year: string
  division?: string
  batch?: string
  phoneNo?: string
  rollNumber?: string
  gender?: string
}

export async function POST(request: NextRequest) {
  // Set CORS headers
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')

  // Handle OPTIONS request for CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers })
  }

  let students: StudentData[] = []
  
  try {
    // Check Content-Type header
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400, headers }
      )
    }

    // Validate environment variables
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
      throw new Error("Gmail credentials are missing in environment variables")
    }
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_TSEC_APP) {
      throw new Error("Firebase service account is missing in environment variables")
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400, headers }
      )
    }

    students = body.students

    if (!students || !Array.isArray(students)) {
      return NextResponse.json(
        { error: "Invalid students data format" },
        { status: 400, headers }
      )
    }

    await ensureCollectionsExist()

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    })

    // Verify SMTP connection
    try {
      await transporter.verify()
      console.log("SMTP connection verified")
    } catch (error) {
      console.error("SMTP verification failed:", error)
      throw new Error("Failed to connect to email server")
    }

    let successCount = 0
    let failedCount = 0
    const results = []

    for (const student of students) {
      try {
        if (!student.email) {
          throw new Error("Email is required")
        }

        const password = generatePassword()

        // Ensure we have a name field
        let fullName = student.name
        if (!fullName && (student.firstName || student.lastName)) {
          fullName = `${student.firstName || ""} ${student.middleName || ""} ${student.lastName || ""}`.trim()
        }

        if (!fullName) {
          throw new Error("Name is required")
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(student.email)) {
          throw new Error("Invalid email format")
        }

        // Create the user in Firebase Auth
        const userRecord = await auth.createUser({
          email: student.email,
          password: password,
          displayName: fullName,
        })

        // Store student data in Firestore
        await db
          .collection(STUDENTS_COLLECTION)
          .doc(userRecord.uid)
          .set({
            Name: fullName,
            email: student.email,
            Branch: student.branch,
            gradyear: student.year,
            div: student.division || "",
            Batch: student.batch || "",
            phoneNo: student.phoneNo || "",
            rollNumber: student.rollNumber || "",
            gender: student.gender || "",
            uid: userRecord.uid,
          }, { merge: true })

        const emailContent = `
Dear ${fullName},

Thank you for registering as a user on the TSEC App.

The TSEC App is a valuable resource for students to access important information such as course schedules, syllabus, and other academic information. The app also provides various resources such as updates from faculty and an events calendar.

We are providing you with the password to access the college app.

Android link: https://play.google.com/store/apps/details?id=com.madclubtsec.tsec_application
iOS link: https://apps.apple.com/us/app/tsec-app/id6446188102

Your login credentials:
Email: ${student.email}
Password: ${password}

Please take some time to explore the app and familiarize yourself with its features. If you have any trouble logging in or accessing any information, please do not hesitate to contact us for further assistance.

Thank you for using the college app, and we hope you find it helpful.

Regards,
Developer's Club, TSEC.
        `

        // Send email
        const mailInfo = await transporter.sendMail({
          from: `"TSEC App" <${process.env.GMAIL_USER}>`,
          to: student.email,
          subject: "Password for TSEC App Access",
          text: emailContent,
        })

        results.push({
          email: student.email,
          success: true,
          emailSent: true,
          messageId: mailInfo.messageId,
        })

        successCount++
        console.log(`Successfully created user and sent email: ${student.email}`)
      } catch (error) {
        console.error(`Failed to process student ${student.email}:`, error)
        results.push({
          email: student.email,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        failedCount++
      }
    }

    return NextResponse.json({
      success: successCount,
      failed: failedCount,
      results,
    }, { headers })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        success: 0,
        failed: students.length,
        results: students.map((s) => ({
          email: s.email,
          success: false,
          error: error instanceof Error ? error.message : "Internal server error",
        })),
      },
      { status: 500, headers }
    )
  }
}
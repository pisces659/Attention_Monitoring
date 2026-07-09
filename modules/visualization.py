import cv2


def draw_landmarks(frame, face_landmarks):

    h, w, _ = frame.shape

    for lm in face_landmarks.landmark:

        x = int(lm.x * w)
        y = int(lm.y * h)

        cv2.circle(frame, (x, y), 1, (0, 255, 0), -1)


def draw_info(frame, frame_no, fps):

    cv2.putText(
        frame,
        f"Frame : {frame_no}",
        (20, 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 255, 255),
        2,
    )

    cv2.putText(
        frame,
        f"FPS : {fps:.2f}",
        (20, 65),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 255, 255),
        2,
    )


def draw_iris(frame, points, color):

    import cv2

    for p in points:

        cv2.circle(
            frame,
            p,
            2,
            color,
            -1
        )

def draw_blink(frame, ear, total_blinks):

    import cv2

    cv2.putText(
        frame,
        f"EAR : {ear:.3f}",
        (20,100),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255,255,0),
        2,
    )

    cv2.putText(
        frame,
        f"Blinks : {total_blinks}",
        (20,130),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255,255,0),
        2,
    )

def draw_pose(frame, yaw, pitch, roll):
    cv2.putText(frame,
                f"Yaw : {yaw:.1f}",
                (20,160),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0,255,255),
                2)

    cv2.putText(frame,
                f"Pitch : {pitch:.1f}",
                (20,190),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0,255,255),
                2)

    cv2.putText(frame,
                f"Roll : {roll:.1f}",
                (20,220),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0,255,255),
                2)

def draw_gaze(frame, gaze):

    cv2.putText(
        frame,
        f"Gaze : {gaze['Horizontal']} {gaze['Vertical']}",
        (20,250),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0,255,0),
        2
    )

    cv2.putText(
        frame,
        f"Screen : {gaze['OnScreen']}",
        (20,280),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0,255,0),
        2
    )

def draw_attention(frame, state):

    import cv2

    color = (0,255,0)

    if state != "Focused":
        color = (0,0,255)

    cv2.putText(
        frame,
        f"Attention : {state}",
        (20,320),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        color,
        2
    )
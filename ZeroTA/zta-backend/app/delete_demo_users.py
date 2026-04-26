from sqlalchemy import create_engine, text

engine = create_engine("sqlite:///D:/OneDrive/Desktop/ZeroTA/zta-backend/users.db")

demo_users = [
    "demo_tanu_block",
    "demoo_tanu_block",
    "demo_tanu",
    "demo_tanuja_block"
]

with engine.connect() as conn:
    for u in demo_users:
        conn.execute(text("DELETE FROM users WHERE username = :u"), {"u": u})
    conn.commit()

print("✅ Demo users deleted successfully!")

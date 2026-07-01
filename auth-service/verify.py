from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
h = "$2b$12$3KMBXbpOs/3e6jSRnAxMb.TBzHCAwpk5I2s6zlvrj.xkeJg5hrIXu"
print("Verify '123456':", pwd_context.verify("123456", h))

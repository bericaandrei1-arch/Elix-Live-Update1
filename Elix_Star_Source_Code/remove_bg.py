
from PIL import Image
import os

# Files to process
files = ['level-1.png', 'level-2.png', 'level-3.png', 'level-4.png']
base_path = r'c:\Users\Sanda\Desktop\Video-Social App MVP (2)\Elix-Star-Live\public'

for f in files:
    path = os.path.join(base_path, f)
    if os.path.exists(path):
        try:
            img = Image.open(path)
            img = img.convert("RGBA")
            datas = img.getdata()
            
            newData = []
            for item in datas:
                # Change all white (also shades of whites) to transparent
                # Tolerance: > 240 for R, G, B
                if item[0] > 230 and item[1] > 230 and item[2] > 230:
                    newData.append((255, 255, 255, 0))
                else:
                    newData.append(item)
            
            img.putdata(newData)
            img.save(path, "PNG")
            print(f"Processed {f}: Removed white background")
        except Exception as e:
            print(f"Error processing {f}: {e}")
    else:
        print(f"File not found: {path}")

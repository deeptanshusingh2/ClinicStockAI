import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

SAMPLE_DIR = Path(__file__).resolve().parent

def create_shelf_image(filename: str, title: str, items: list, glare: bool = False):
    width, height = 900, 500
    img = Image.new("RGB", (width, height), color=(240, 244, 248))
    draw = ImageDraw.Draw(img)
    
    # Draw clinic shelf background
    draw.rectangle([0, 0, width, 400], fill=(230, 236, 242))
    # Shelf wood/metal ledge
    draw.rectangle([0, 390, width, 440], fill=(180, 190, 200))
    draw.rectangle([0, 440, width, 500], fill=(205, 215, 225))
    
    # Title banner at top
    draw.rectangle([0, 0, width, 45], fill=(30, 58, 138))
    draw.text((20, 12), f"CLINIC DISPENSARY AUDIT — {title.upper()}", fill=(255, 255, 255))
    
    # Draw medicine boxes on the shelf
    box_width = 220
    box_height = 240
    start_y = 150
    spacing = 60
    
    for i, item in enumerate(items):
        start_x = 40 + i * (box_width + spacing)
        box_color = item.get("color", (255, 255, 255))
        accent_color = item.get("accent", (59, 130, 246))
        
        # Medicine box body & drop shadow
        draw.rectangle([start_x + 6, start_y + 6, start_x + box_width + 6, start_y + box_height + 6], fill=(160, 170, 180))
        draw.rectangle([start_x, start_y, start_x + box_width, start_y + box_height], fill=box_color, outline=(148, 163, 184), width=2)
        
        # Color banner stripe
        draw.rectangle([start_x, start_y, start_x + box_width, start_y + 35], fill=accent_color)
        draw.text((start_x + 12, start_y + 8), item.get("category", "Rx MEDICINE"), fill=(255, 255, 255))
        
        # Medicine name & strength
        draw.text((start_x + 14, start_y + 50), item["name"], fill=(15, 23, 42))
        draw.text((start_x + 14, start_y + 75), item["strength"], fill=(71, 85, 105))
        
        # Divider
        draw.line([start_x + 10, start_y + 110, start_x + box_width - 10, start_y + 110], fill=(226, 232, 240), width=1)
        
        # Batch & Expiry
        if item.get("batch"):
            draw.text((start_x + 14, start_y + 125), f"Batch: {item['batch']}", fill=(30, 41, 59))
        else:
            draw.text((start_x + 14, start_y + 125), "Batch: [Illegible / Turned]", fill=(194, 65, 12))
            
        if item.get("expiry"):
            draw.text((start_x + 14, start_y + 150), f"Exp: {item['expiry']}", fill=(30, 41, 59))
        else:
            draw.text((start_x + 14, start_y + 150), "Exp: [Obscured by Glare]", fill=(194, 65, 12))
            
        # Visible count badge
        draw.rectangle([start_x + 14, start_y + 190, start_x + box_width - 14, start_y + 225], fill=(241, 245, 249), outline=(203, 213, 225))
        draw.text((start_x + 22, start_y + 200), f"Visible Packages: {item.get('visible_count', 1)}", fill=(51, 65, 85))
        
    # Apply simulated shelf glare if enabled
    if glare:
        # Glare wash across right side
        for g in range(60):
            alpha_line = int(80 * (1 - g/60))
            draw.line([500 + g*5, 0, 400 + g*5, 400], fill=(255, 255, 255), width=3)
            
    img.save(SAMPLE_DIR / filename, quality=92)
    print(f"Generated {filename}")

def main():
    items_clear = [
        {"name": "Amoxicillin", "strength": "500 mg", "batch": "AMX-2024-09", "expiry": "2026-11-15", "visible_count": 4, "color": (255, 255, 255), "accent": (16, 185, 129), "category": "ANTIBIOTIC"},
        {"name": "Paracetamol", "strength": "650 mg", "batch": "PCM-650-B4", "expiry": "2027-05-30", "visible_count": 6, "color": (255, 255, 255), "accent": (239, 68, 68), "category": "ANALGESIC"},
        {"name": "Ibuprofen", "strength": "400 mg", "batch": "IBU-8711", "expiry": "2026-08-10", "visible_count": 3, "color": (255, 255, 255), "accent": (245, 158, 11), "category": "NSAID"}
    ]
    create_shelf_image("shelf_01_clear.jpg", "Shelf A: Unobstructed Primary Stock", items_clear, glare=False)

    items_obscured = [
        {"name": "Azithromycin Susp.", "strength": "200mg/5ml", "batch": None, "expiry": None, "visible_count": 3, "color": (254, 249, 195), "accent": (217, 119, 6), "category": "PEDIATRIC SUSPENSION"},
        {"name": "Ambroxol Syrup", "strength": "30mg/5ml", "batch": "AMB-9104", "expiry": None, "visible_count": 2, "color": (255, 255, 255), "accent": (14, 165, 233), "category": "RESPIRATORY"},
        {"name": "Cetirizine Tab", "strength": "10 mg", "batch": "CTZ-2024", "expiry": "2026-11-20", "visible_count": 5, "color": (255, 255, 255), "accent": (99, 102, 241), "category": "ANTIHISTAMINE"}
    ]
    create_shelf_image("shelf_02_obscured.jpg", "Shelf B: Obscured Dates & Reflection", items_obscured, glare=True)

    items_mixed = [
        {"name": "Ciprofloxacin", "strength": "500 mg", "batch": "CIP-8812", "expiry": "2026-12-15", "visible_count": 4, "color": (255, 255, 255), "accent": (13, 148, 136), "category": "BROAD SPECTRUM"},
        {"name": "Metformin HCl", "strength": "500 mg", "batch": "MET-4021", "expiry": "2027-03-30", "visible_count": 6, "color": (255, 255, 255), "accent": (34, 197, 94), "category": "ENDOCRINOLOGY"},
        {"name": "Hydrocortisone Vials", "strength": "100mg/vial", "batch": None, "expiry": "2026-09-10", "visible_count": 2, "color": (255, 241, 242), "accent": (225, 29, 72), "category": "EMERGENCY TRAY"}
    ]
    create_shelf_image("shelf_03_mixed.jpg", "Shelf C: Mixed Formulations & Trays", items_mixed, glare=False)

    ground_truth = {
        "version": "1.0",
        "description": "VisionStock evaluation benchmark test set",
        "datasets": [
            {
                "file": "shelf_01_clear.jpg",
                "label": "Clearly Visible Primary Stock",
                "expected": items_clear
            },
            {
                "file": "shelf_02_obscured.jpg",
                "label": "Obscured Expiry & Reflective Glare",
                "expected": items_obscured
            },
            {
                "file": "shelf_03_mixed.jpg",
                "label": "Mixed Formulations & Vials",
                "expected": items_mixed
            }
        ]
    }
    with open(SAMPLE_DIR / "ground_truth.json", "w") as f:
        json.dump(ground_truth, f, indent=2)
    print("Generated ground_truth.json")

if __name__ == "__main__":
    main()

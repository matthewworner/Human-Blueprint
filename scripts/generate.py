import json
import random

# Current counts
current_era_counts = {
    'era1': 11,  # 50k-10k BCE
    'era2': 10,  # 10k-3k BCE
    'era3': 2,   # 3k BCE-0 CE
    'era4': 4,   # 0-1500 CE
    'era5': 2,   # 1500-1900
    'era6': 4,   # 1900-2000
    'era7': 16   # 2000-present
}

target_era_counts = {
    'era1': 75,
    'era2': 75,
    'era3': 75,
    'era4': 75,
    'era5': 75,
    'era6': 75,
    'era7': 50
}

current_region_counts = {
    'Europe': 14,
    'Asia': 6,
    'Africa': 5,
    'Americas': 17,
    'Oceania': 4,
    'Middle East': 3
}

target_region_counts = {
    'Europe': 100,
    'Asia': 100,
    'Africa': 75,
    'Americas': 75,
    'Oceania': 75,
    'Middle East': 75
}

# Calculate additions
add_era = {era: target_era_counts[era] - current_era_counts[era] for era in target_era_counts}

add_region = {region: target_region_counts[region] - current_region_counts[region] for region in target_region_counts}

print('Add per era:', add_era)
print('Add per region:', add_region)

# Sample URLs from Wikimedia Commons (CORS-compliant)
sample_urls = [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Lascaux_painting.jpg/800px-Lascaux_painting.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/AltamiraBison.jpg/800px-AltamiraBison.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Ubirr_Rock_Art.jpg/800px-Ubirr_Rock_Art.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Bhimbetka_Rock_Shelters_Paintings.jpg/800px-Bhimbetka_Rock_Shelters_Paintings.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Tassili_n%27Ajjer_Rock_Art.jpg/800px-Tassili_n%27Ajjer_Rock_Art.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Newgrange_Spiral_Carving.jpg/800px-Newgrange_Spiral_Carving.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Eye_of_Horus.jpg/800px-Eye_of_Horus.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Tibetan_Mandala.jpg/800px-Tibetan_Mandala.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Aboriginal_Dot_Painting.jpg/800px-Aboriginal_Dot_Painting.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Banksy_Hand_Graffiti.jpg/800px-Banksy_Hand_Graffiti.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Chalk_Handprint_Protest.jpg/800px-Chalk_Handprint_Protest.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Mohamed_Mahmoud_Street_Graffiti.jpg/800px-Mohamed_Mahmoud_Street_Graffiti.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Hong_Kong_Protest_Handprints.jpg/800px-Hong_Kong_Protest_Handprints.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/BLM_Handprint_Mural.jpg/800px-BLM_Handprint_Mural.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Ukraine_Handprint_Memorial.jpg/800px-Ukraine_Handprint_Memorial.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Sego_Canyon_Handprints.jpg/800px-Sego_Canyon_Handprints.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Tainter_Cave_Pictographs.jpg/800px-Tainter_Cave_Pictographs.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Chumash_Rock_Art_Spiral.jpg/800px-Chumash_Rock_Art_Spiral.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Petroglyph_Spiral_Design.jpg/800px-Petroglyph_Spiral_Design.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Maori_Spiral_Tattoo.jpg/800px-Maori_Spiral_Tattoo.jpg"
]

types = ["handprint", "cave_painting", "rock_painting", "carved", "painted", "graffiti", "sketch", "digital", "protest", "pictograph", "geoglyph"]

colors_list = ["red", "black", "white", "yellow", "blue", "green", "ochre", "gold", "brown", "grey", "stone", "sand"]

def random_choice(arr):
    return random.choice(arr)

def random_colors():
    num = random.randint(1, 4)
    cols = random.sample(colors_list, num)
    return list(set(cols))  # unique

def random_position():
    return [
        round((random.random() - 0.5) * 40, 2),
        round((random.random() - 0.5) * 20, 2),
        round((random.random() - 0.5) * 40, 2)
    ]

# Era ranges
era_ranges = {
    'era1': [-50000, -10000],
    'era2': [-10000, -3000],
    'era3': [-3000, 0],
    'era4': [1, 1500],
    'era5': [1501, 1900],
    'era6': [1901, 2000],
    'era7': [2001, 2025]
}

def random_era(era_key):
    min_val, max_val = era_ranges[era_key]
    return random.randint(min_val, max_val)

regions = list(target_region_counts.keys())

# Generate new entries
new_entries = []
id_counter = 51

for era_key, count in add_era.items():
    for _ in range(count):
        region = random_choice(regions)
        entry_id = f"generated_{id_counter:03d}"
        url = random_choice(sample_urls)
        position = random_position()
        era = random_era(era_key)
        color_list = random_colors()
        entry_type = random_choice(types)
        new_entries.append({
            "id": entry_id,
            "url": url,
            "position": position,
            "era": era,
            "region": region,
            "colors": color_list,
            "type": entry_type
        })
        id_counter += 1

# Read current images.json
with open('public/images.json', 'r') as f:
    current_data = json.load(f)

# Combine
all_data = current_data + new_entries

# Write back
with open('public/images.json', 'w') as f:
    json.dump(all_data, f, indent=2)

print(f'Expanded to {len(all_data)} images.')
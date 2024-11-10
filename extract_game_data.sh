#!/bin/bash

if [ ! -f DepotDownloader ]; then
    wget https://github.com/SteamRE/DepotDownloader/releases/download/DepotDownloader_2.7.3/DepotDownloader-linux-x64.zip -O DepotDownloader-linux-x64.zip
    unzip -o DepotDownloader-linux-x64.zip DepotDownloader && rm DepotDownloader-linux-x64.zip
fi

if [ ! -f Decompiler ]; then
    wget https://github.com/ValveResourceFormat/ValveResourceFormat/releases/download/10.2/Decompiler-linux-x64.zip -O Decompiler-linux-x64.zip
    unzip -o Decompiler-linux-x64.zip && rm Decompiler-linux-x64.zip
fi

# Download Deadlock Game files
./DepotDownloader -app 1422450 -username "$STEAM_USERNAME" -password "$STEAM_PASSWORD" || exit 1

mkdir -p depots/game
rsync -av depots/*/*/game/* depots/game/
find depots/ -type d -empty -delete

# Extract Map-VPKs
citadel_folder="depots/game/citadel"

./Decompiler -i "$citadel_folder"/pak01_dir.vpk -d --threads 8 -o "$citadel_folder" -f scripts
./Decompiler -i "$citadel_folder"/pak01_dir.vpk -d --threads 8 -o "$citadel_folder" -f resource
./Decompiler -i "$citadel_folder"/pak01_dir.vpk -d --threads 8 -o "$citadel_folder" -f panorama

# Extract icon files
mkdir -p svgs
find depots/game/ -type f -name '*.svg' -print0 | xargs -0 -n 1 cp -t svgs/

# Extract video files
mkdir -p /assets/videos
cp -r "$citadel_folder"/panorama/videos/hero_abilities /assets/videos/
find videos -type f -name "*.webm" -print0 | \
    xargs -P 8 -0 -I {} sh -c '
        video_file="{}"
        video_mp4_file=$(echo "$video_file" | sed "s/.webm/_h264.mp4/")
        echo "Converting $video_file to $video_mp4_file"
        ffmpeg -i "$video_file" -c:v libx264 -crf 23 -y "$video_mp4_file"
    '

# Extract image files
mkdir -p /assets/images
mkdir -p /assets/images/hud

# Copy all heroes images
cp -r "$citadel_folder"/panorama/images/heroes /assets/images/

# Copy entire HUD directory structure recursively
cp -r "$citadel_folder"/panorama/images/hud/* /assets/images/hud/

# Ensure hero portraits are in both locations
cp "$citadel_folder"/panorama/images/hud/hero_portraits/* /assets/images/heroes/

# Copy root panorama images
cp "$citadel_folder"/panorama/images/*.* /assets/images/

# Copy abilities and upgrades
mkdir -p /assets/images/abilities
cp -r "$citadel_folder"/panorama/images/hud/abilities /assets/images/
cp -r "$citadel_folder"/panorama/images/upgrades /assets/images/

# Copy map images
mkdir -p /assets/images/maps
cp -r "$citadel_folder"/panorama/images/minimap/base/* /assets/images/maps/

# Copy rank images
mkdir -p /assets/images/ranks
cp -r "$citadel_folder"/panorama/images/ranked/badges/* /assets/images/ranks/

# Generate webp images
for file in $(find /assets/images -type f -name "*.png"); do
    base_name=$(basename "$file")
    dir_name=$(dirname "$file")
    file_name="${base_name%.png}"
    new_file_name="${file_name}.webp"
    new_file_path="$dir_name/$new_file_name"
    convert -quality 50 -define webp:lossless=true "$file" "$new_file_path"
    echo "Converted to webp: $new_file_path"
done

# Optimize images
optipng -o2 /assets/images/**/*.png

# Initialize and push to Git repository
cd /assets
git init
git remote add origin https://${GITHUB_TOKEN}@github.com/Deadbotgg/deadlock-assets.git
git add .
git commit -m "Update game assets $(date +%Y-%m-%d)"
git push -f origin main

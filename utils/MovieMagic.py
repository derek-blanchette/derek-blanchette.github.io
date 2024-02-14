import os
from os import walk
from os import system
# data analysis
import pandas as pd
# progress bar
from tqdm import tqdm
from datetime import date
from pymediainfo import MediaInfo


# Set the title for the console
system("title " + "~** Movie Magic **~")

# Specify the folders to search recursively
folder_list = ["C:\\Movies1",
               "D:\\Movies2"]

# Initialize the video list
video_list = []

# Iterate over the file system, only keep files with specific extensions/endings
for folder in folder_list:
    for root, dirs, files in os.walk(folder):
        for file in files:
            if any(map(file.__contains__, [".mp4", ".mkv", ".avi"])):
                video_list.append(os.path.join(root, file))  

# Initialize video size list
video_sizes = []

# Intialize output data frame (pandas)
output = pd.DataFrame()

# For every video file, get the media info data and use the OS to get the file size
# Calculate bitrate using approximation and save ALL other XML data as well
# tqdm is used for progress bar

for vid in tqdm(video_list):
    tqdm.write(vid),
    vid_size = os.path.getsize(vid)
    media_info = MediaInfo.parse(vid)
    for track in media_info.tracks:
        if (track.track_type == "Video") and (track.duration != None):  # !! check to make sure its not a bad video file !!
            
            # Dump video track data to dictionary
            dictionary = track.to_data()
            
            # Add key-value pairs to the dictionary
            dictionary['file'] = vid
            dictionary['file_size'] = vid_size/ (1000 ** 3)
            
            duration = int(float(track.duration)/1000) # duration is in milliseconds
            dictionary['computed_duration_secs'] = duration
            
            try:
                bitrate = int((((vid_size)/duration)/1000*8)) # 8 because it's in BITS (8 of them per byte) KILOBITS-PER-SECOND
            except:
                bitrate = 0
            dictionary['computed_bitrate'] = bitrate
            
            # Convert dictionary to df
            df_dictionary = pd.DataFrame([dictionary])
            
            # Append the dictionary to the df 
            output = pd.concat([output, df_dictionary], ignore_index=True)                        
    
    
    video_sizes.append(bitrate)

# Output just the bitrate data for all of the movies
df = pd.DataFrame(list(zip(video_list, video_sizes)),
               columns =['Video', 'Bitrate'])
df.to_csv("C:\\Movie Bitrates Output.csv", index = False, header=True) 

today = date.today()

# Output ALL of the data for ALL of the movies
output.to_csv("C:\\All Movie Data Output "+ str(today)+".csv", index=False, header=True)
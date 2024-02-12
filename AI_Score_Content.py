import pandas as pd
import sqlite3
import openai
import time
import re

# OPENAI SECRET KEY:
openai.api_key = "PUTYOURAPIKEYHERE"

# Connect to the database
conn = sqlite3.connect("URLS.sqlite")
c = conn.cursor()

# Query the database and store results in a DataFrame
df = pd.read_sql_query("SELECT * from LINKS where tech is null", conn)

df['tech'] = ''
df['tech_prob'] = ''

for index, row in df.iterrows():
    # setup messages list
    messages = [{"role": "system", "content": "You are a content rating system. \
    Your job is to assign a numeric rating to a post title on a scale of 1 to 100, as well a a confidence probability for that rating. \
    You will be scoring the likelihood of the post title to be about technology or computing. Provide only numeric output while keeping the response as short as possible."},]
    
    # make the request
    input = "Rate this title: \"" + str(row['title']) + "\""
    messages.append({"role": "user", "content": input})
    print(input)
    chat = openai.ChatCompletion.create(model="gpt-3.5-turbo", messages=messages)
    
    try:
        tech = chat.choices[0].message.content
        print(tech)
        temp = re.findall(r'\d+', tech)
        numeric_values= list(map(int, temp))
        print("The output is: " + str(numeric_values[0]))
        print(numeric_values)
        
        if len(numeric_values) == 2:
            df.at[index, 'tech'] = numeric_values[0]
            df.at[index, 'tech_prob'] = numeric_values[1]

    except:
        df.at[index, 'tech'] = -1
        df.at[index, 'tech_prob'] = -1           

    # Save each result as you go
    df.to_sql("temp", conn, if_exists="replace", index=False)
    print("New data written to temporary table")
    
    c.execute("UPDATE archive SET tech = ? where id = ?", (df.at[index, 'tech'], df.at[index, 'id'],))
    c.execute("UPDATE archive SET tech_prob = ? where id = ?", (df.at[index, 'tech_prob'], df.at[index, 'id'],))    
    
    # Commit the changes to the database
    conn.commit()    
    print("Results merged into archive.")
    print("waiting")
    time.sleep(20)
      
print("All records have been processed.")
# Close the cursor and the connection
conn.close()

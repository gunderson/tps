import urllib, json
baseUrl = 'https://klangfiles.s3-eu-west-1.amazonaws.com/uploads/klang/';
jsonurl = urllib.urlopen('http://klangfiles.s3.amazonaws.com/uploads/projects/kVNwR/config.json')
data = json.loads(jsonurl.read()) # <-- read from it

for fileEntry in data['files']:
    fileUrl = fileEntry['url'];
    #print fileEntry['url'] + '\n'

    mp3File = urllib.URLopener()
    mp3File.retrieve( baseUrl + fileUrl + '.mp3', 'sounds/' + fileUrl + '.mp3' )

    oggFile = urllib.URLopener()
    oggFile.retrieve( baseUrl + fileUrl + '.ogg', 'sounds/' + fileUrl + '.ogg' )

with open('config.json', 'w') as outfile:
  json.dump(data, outfile)

print len( data['files'] );

# testfile = urllib.URLopener()
# testfile.retrieve("http://randomsite.com/file.gz", "file.gz")
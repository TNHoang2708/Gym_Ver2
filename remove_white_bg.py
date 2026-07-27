from PIL import Image

def remove_white_bg(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    visited = set()
    queue = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
    
    # Anything > 230 is basically white background
    THRESHOLD = 230
    
    head = 0
    while head < len(queue):
        x, y = queue[head]
        head += 1
        
        if (x, y) in visited:
            continue
            
        visited.add((x, y))
        r, g, b, a = pixels[x, y]
        
        if r > THRESHOLD and g > THRESHOLD and b > THRESHOLD:
            pixels[x, y] = (0, 0, 0, 0)
            
            if x + 1 < width: queue.append((x+1, y))
            if x - 1 >= 0: queue.append((x-1, y))
            if y + 1 < height: queue.append((x, y+1))
            if y - 1 >= 0: queue.append((x, y-1))

    # Edge cleanup to prevent white halos
    for x in range(width):
        for y in range(height):
            r, g, b, a = pixels[x, y]
            if a == 255 and r > 180 and g > 180 and b > 180:
                is_edge = False
                for dx, dy in [(0,1), (1,0), (0,-1), (-1,0)]:
                    nx, ny = x+dx, y+dy
                    if 0 <= nx < width and 0 <= ny < height:
                        if pixels[nx, ny][3] == 0:
                            is_edge = True
                            break
                if is_edge:
                    pixels[x, y] = (0, 0, 0, 0) 

    img.save(output_path, "PNG")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 2:
        remove_white_bg(sys.argv[1], sys.argv[2])
    else:
        print("Usage: python3 remove_white_bg.py <input> <output>")

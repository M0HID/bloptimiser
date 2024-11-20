import modal
from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
import random
import json

app = FastAPI()
modal_app = modal.App()

def calculateDistance(p1, p2):
    return np.sqrt((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)

@app.get("/")
def read_root(sets: str=""):
    if sets == "":
        return {"error": "emptySet"}
    sets = eval(sets)
    startEnd = {}
    for i in range(len(sets)):
        startEnd[i] = str([sets[i][0], sets[i][-1]])

    sorted_sets = [sets[0]]
    sets.pop(0)
    random.shuffle(sets)
    while len(sets) > 0:
        lastPoint = sorted_sets[-1][-1]
        firstPoint = sorted_sets[0][0]
        closest = 0
        closestDistance = min(calculateDistance(lastPoint, sets[0][0]), calculateDistance(firstPoint, sets[0][0]))
        appendToEnd = calculateDistance(lastPoint, sets[0][0]) < calculateDistance(firstPoint, sets[0][0])
        
        for i in range(1, len(sets)):
            distanceToLast = calculateDistance(lastPoint, sets[i][0])
            distanceToFirst = calculateDistance(firstPoint, sets[i][0])
            distance = min(distanceToLast, distanceToFirst)
            
            if distance < closestDistance:
                closestDistance = distance
                closest = i
                appendToEnd = distanceToLast < distanceToFirst
        
        if appendToEnd:
            sorted_sets.append(sets[closest])
        else:
            sorted_sets.insert(0, sets[closest])
        
        sets.pop(closest)
        for i in range(len(sorted_sets)):
            for j in range(len(sorted_sets[i])):
                for k in range(2):
                    sorted_sets[i][j][k] = round(sorted_sets[i][j][k], 1)

    if sorted_sets[0][0][0] > sorted_sets[-1][0][0]:
        sorted_sets = sorted_sets[::-1]
    elif sorted_sets[0][0][1] > sorted_sets[-1][0][1]:
        sorted_sets = sorted_sets[::-1]

    return {"sets": sorted_sets}

@modal_app.function(
    image=modal.Image.debian_slim().pip_install("fastapi", "numpy"),
)
@modal.asgi_app()
def fastapi_app():
    return app